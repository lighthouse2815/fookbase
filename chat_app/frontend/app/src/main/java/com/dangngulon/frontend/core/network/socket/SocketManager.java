package com.dangngulon.frontend.core.network.socket;

import android.text.TextUtils;
import android.util.Log;

import androidx.core.util.Consumer;

import com.dangngulon.frontend.BuildConfig;
import com.dangngulon.frontend.core.utils.data.AuthManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.net.URI;

import javax.inject.Inject;
import javax.inject.Singleton;

import io.reactivex.disposables.Disposable;
import io.reactivex.disposables.SerialDisposable;
import ua.naiksoftware.stomp.Stomp;
import ua.naiksoftware.stomp.StompClient;
import ua.naiksoftware.stomp.dto.StompHeader;

@Singleton
public class SocketManager {

    private static final String TAG = "SOCKET";
    private static final String AUTHORIZATION_HEADER = "Authorization";

    private final AuthManager authManager;
    private final String socketUrl;
    private final Object connectionLock = new Object();
    private final List<Runnable> pendingActions = new ArrayList<>();

    private StompClient stompClient;
    private Disposable lifecycleDisposable;
    private volatile boolean connecting;
    private volatile boolean opened;

    @Inject
    public SocketManager(AuthManager authManager) {
        this.authManager = authManager;
        this.socketUrl = buildSocketUrl(BuildConfig.BASE_URL);
    }

    public synchronized void connect() {
        connectIfNeeded();
    }

    private void connectIfNeeded() {
        synchronized (connectionLock) {
            if (stompClient == null) {
                stompClient = Stomp.over(
                        Stomp.ConnectionProvider.OKHTTP,
                        socketUrl
                );
            }

            ensureLifecycleLogger();

            if (opened || connecting || stompClient.isConnected()) {
                return;
            }

            List<StompHeader> connectHeaders = buildConnectHeaders();
            if (connectHeaders.isEmpty()) {
                Log.w(TAG, "Skip STOMP connect because access token is missing");
                return;
            }

            connecting = true;
            stompClient.connect(connectHeaders);
        }
    }

    private void ensureLifecycleLogger() {
        if (lifecycleDisposable != null && !lifecycleDisposable.isDisposed()) {
            return;
        }

        lifecycleDisposable = stompClient.lifecycle().subscribe(event -> {
            switch (event.getType()) {
                case OPENED:
                    Log.d(TAG, "OPENED");
                    opened = true;
                    connecting = false;
                    flushPendingActions();
                    break;

                case ERROR:
                    Log.e(TAG, "ERROR", event.getException());
                    opened = false;
                    connecting = false;
                    break;

                case CLOSED:
                    Log.d(TAG, "CLOSED");
                    opened = false;
                    connecting = false;
                    break;

                case FAILED_SERVER_HEARTBEAT:
                    Log.w(TAG, "FAILED_SERVER_HEARTBEAT");
                    break;
            }
        });
    }

    private List<StompHeader> buildConnectHeaders() {
        List<StompHeader> headers = new ArrayList<>();
        String bearerToken = getBearerToken();
        if (bearerToken != null) {
            headers.add(new StompHeader(AUTHORIZATION_HEADER, bearerToken));
        }
        return headers;
    }

    private String getBearerToken() {
        String accessToken = authManager.getAccessToken();
        if (TextUtils.isEmpty(accessToken)) {
            Log.w(TAG, "Access token missing while opening socket connection");
            return null;
        }

        return "Bearer " + accessToken;
    }

    public synchronized void disconnect() {
        if (stompClient != null) {
            stompClient.disconnect();
            Log.d(TAG, "Disconnected");
        }

        opened = false;
        connecting = false;
        pendingActions.clear();

        if (lifecycleDisposable != null && !lifecycleDisposable.isDisposed()) {
            lifecycleDisposable.dispose();
        }
        lifecycleDisposable = null;
    }

    public void send(String destination, String payload) {
        runWhenConnected(
                () -> stompClient.send(destination, payload)
                        .subscribe(
                                () -> Log.d(TAG, "Sent: " + destination),
                                throwable -> Log.e(TAG, "Send error", throwable)
                        )
        );
    }

    public Disposable subscribe(String topic, Consumer<String> onMessage) {
        SerialDisposable serialDisposable = new SerialDisposable();

        runWhenConnected(
                () -> {
                    Disposable subscription = stompClient.topic(topic)
                            .subscribe(
                                    topicMessage -> {
                                        Log.d(TAG, "Received: " + topic);
                                        onMessage.accept(topicMessage.getPayload());
                                    },
                                    throwable -> Log.e(TAG, "Subscribe error", throwable)
                            );
                    serialDisposable.set(subscription);
                }
        );

        return serialDisposable;
    }

    private void runWhenConnected(Runnable action) {
        boolean runImmediately = false;

        synchronized (connectionLock) {
            if (opened && stompClient != null && stompClient.isConnected()) {
                runImmediately = true;
            } else {
                if (getBearerToken() == null) {
                    Log.w(TAG, "Skip socket action because access token is missing");
                    return;
                }

                pendingActions.add(action);
            }
        }

        if (runImmediately) {
            action.run();
            return;
        }

        connectIfNeeded();
    }

    private void flushPendingActions() {
        List<Runnable> actionsToExecute;
        synchronized (connectionLock) {
            actionsToExecute = new ArrayList<>(pendingActions);
            pendingActions.clear();
        }

        for (Runnable action : actionsToExecute) {
            try {
                action.run();
            } catch (Exception exception) {
                Log.e(TAG, "Failed to execute queued socket action", exception);
            }
        }
    }

    public boolean isConnected() {
        return opened && stompClient != null && stompClient.isConnected();
    }

    private String buildSocketUrl(String baseUrl) {
        try {
            URI baseUri = URI.create(baseUrl);
            String scheme = baseUri.getScheme() == null ? "http" : baseUri.getScheme().toLowerCase(Locale.ROOT);
            String wsScheme = "https".equals(scheme) ? "wss" : "ws";

            String host = baseUri.getHost();
            if (host == null || host.isBlank()) {
                throw new IllegalArgumentException("Invalid BASE_URL host");
            }

            StringBuilder builder = new StringBuilder();
            builder.append(wsScheme).append("://").append(host);

            int port = baseUri.getPort();
            if (port != -1) {
                builder.append(":").append(port);
            }

            builder.append("/ws");
            return builder.toString();
        } catch (Exception exception) {
            Log.w(TAG, "Invalid BASE_URL for socket, fallback to ws://localhost/ws", exception);
            return "ws://localhost/ws";
        }
    }
}
