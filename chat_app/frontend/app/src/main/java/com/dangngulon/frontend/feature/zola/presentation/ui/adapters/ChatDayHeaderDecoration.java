package com.dangngulon.frontend.feature.zola.presentation.ui.adapters;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.util.TypedValue;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.dangngulon.frontend.core.common.ui.helpers.TimeFormatter;
import com.dangngulon.frontend.feature.zola.presentation.model.MessageUiModel;

public class ChatDayHeaderDecoration extends RecyclerView.ItemDecoration {
    private final Paint textPaint;
    private final Paint backgroundPaint;
    private final Rect textBounds = new Rect();
    private final RectF backgroundRect = new RectF();

    private final int headerSpacePx;
    private final int horizontalPaddingPx;
    private final int verticalPaddingPx;
    private final float cornerRadiusPx;

    public ChatDayHeaderDecoration(Context context) {
        textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(Color.parseColor("#D5DCEF"));
        textPaint.setTextSize(sp(context, 12f));

        backgroundPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        backgroundPaint.setColor(Color.parseColor("#2E3646"));

        horizontalPaddingPx = dp(context, 10f);
        verticalPaddingPx = dp(context, 4f);
        headerSpacePx = dp(context, 32f);
        cornerRadiusPx = dp(context, 12f);
    }

    @Override
    public void getItemOffsets(
            @NonNull Rect outRect,
            @NonNull View view,
            @NonNull RecyclerView parent,
            @NonNull RecyclerView.State state
    ) {
        int position = parent.getChildAdapterPosition(view);
        if (position == RecyclerView.NO_POSITION) {
            return;
        }

        MessageAdapter adapter = getMessageAdapter(parent);
        if (adapter == null || !shouldDrawHeader(position, adapter)) {
            return;
        }

        outRect.top = headerSpacePx;
    }

    @Override
    public void onDrawOver(@NonNull Canvas canvas, @NonNull RecyclerView parent, @NonNull RecyclerView.State state) {
        MessageAdapter adapter = getMessageAdapter(parent);
        if (adapter == null) {
            return;
        }

        int childCount = parent.getChildCount();
        for (int index = 0; index < childCount; index++) {
            View child = parent.getChildAt(index);
            int position = parent.getChildAdapterPosition(child);
            if (position == RecyclerView.NO_POSITION || !shouldDrawHeader(position, adapter)) {
                continue;
            }

            MessageUiModel message = adapter.getMessageAt(position);
            if (message == null) {
                continue;
            }

            String title = TimeFormatter.formatChatDayHeader(message.getCreatedAt());
            if (title == null || title.trim().isEmpty()) {
                continue;
            }

            drawHeader(canvas, parent, child, title.trim());
        }
    }

    private void drawHeader(Canvas canvas, RecyclerView parent, View child, String title) {
        textPaint.getTextBounds(title, 0, title.length(), textBounds);
        Paint.FontMetrics metrics = textPaint.getFontMetrics();

        float textWidth = textPaint.measureText(title);
        float backgroundWidth = textWidth + (horizontalPaddingPx * 2f);
        float backgroundHeight = (metrics.descent - metrics.ascent) + (verticalPaddingPx * 2f);

        float centerX = parent.getWidth() / 2f;
        float top = child.getTop() - headerSpacePx + (headerSpacePx - backgroundHeight) / 2f;

        backgroundRect.left = centerX - (backgroundWidth / 2f);
        backgroundRect.top = top;
        backgroundRect.right = centerX + (backgroundWidth / 2f);
        backgroundRect.bottom = top + backgroundHeight;

        canvas.drawRoundRect(backgroundRect, cornerRadiusPx, cornerRadiusPx, backgroundPaint);

        float textX = centerX - (textWidth / 2f);
        float textY = backgroundRect.top + verticalPaddingPx - metrics.ascent;
        canvas.drawText(title, textX, textY, textPaint);
    }

    private boolean shouldDrawHeader(int position, MessageAdapter adapter) {
        MessageUiModel current = adapter.getMessageAt(position);
        if (current == null || current.getCreatedAt() == null) {
            return false;
        }

        if (position == 0) {
            return true;
        }

        MessageUiModel previous = adapter.getMessageAt(position - 1);
        if (previous == null || previous.getCreatedAt() == null) {
            return true;
        }

        return !TimeFormatter.isSameLocalDate(previous.getCreatedAt(), current.getCreatedAt());
    }

    private MessageAdapter getMessageAdapter(RecyclerView parent) {
        RecyclerView.Adapter<?> adapter = parent.getAdapter();
        if (adapter instanceof MessageAdapter messageAdapter) {
            return messageAdapter;
        }

        return null;
    }

    private int dp(Context context, float value) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                context.getResources().getDisplayMetrics()
        );
    }

    private float sp(Context context, float value) {
        return TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_SP,
                value,
                context.getResources().getDisplayMetrics()
        );
    }
}
