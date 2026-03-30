package com.dang.app.utils.security.jwt;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class StompJwtChannelInterceptor implements ChannelInterceptor {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtDecoder jwtDecoder;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (StompCommand.CONNECT.equals(command)) {
            accessor.setUser(buildAuthentication(accessor));
            return message;
        }

        if ((StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command))
                && accessor.getUser() == null) {
            throw new AccessDeniedException("STOMP session is not authenticated");
        }

        return message;
    }

    private JwtAuthenticationToken buildAuthentication(StompHeaderAccessor accessor) {
        String authorization = accessor.getFirstNativeHeader(AUTHORIZATION_HEADER);
        if (!StringUtils.hasText(authorization) || !authorization.startsWith(BEARER_PREFIX)) {
            throw new AccessDeniedException("Missing or invalid Authorization header in STOMP CONNECT");
        }

        Jwt jwt = jwtDecoder.decode(authorization.substring(BEARER_PREFIX.length()));
        return new JwtAuthenticationToken(jwt);
    }
}
