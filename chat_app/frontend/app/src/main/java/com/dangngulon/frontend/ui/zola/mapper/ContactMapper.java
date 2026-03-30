package com.dangngulon.frontend.ui.zola.mapper;

import com.dangngulon.frontend.model.zola.response.ContactResponse;
import com.dangngulon.frontend.model.zola.response.RecentUserChatResponse;
import com.dangngulon.frontend.ui.zola.model.SelectableContactItem;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class ContactMapper {

    private ContactMapper() {}

    public static SelectableContactItem fromRecentUserChatResponse(RecentUserChatResponse response) {
        if (response == null) {
            return null;
        }
        
        return new SelectableContactItem(
                response.getUserId(),
                response.getUsername(),
                response.getAvatar(),
                "",
                response.getLastChatTime()
        );
    }

    public static SelectableContactItem fromContactResponse(ContactResponse response) {
        if (response == null) {
            return null;
        }
        
        return new SelectableContactItem(
                response.getUserId() != null ? response.getUserId().toString() : null,
                response.getNickName(),
                response.getAvatarUrl(),
                response.getPhoneNumber(),
                null // ContactResponse doesn't have lastChatTime
        );
    }

    public static List<SelectableContactItem> fromRecentUserChatResponseList(List<RecentUserChatResponse> responseList) {
        if (responseList == null) {
            return new ArrayList<>();
        }
        
        List<SelectableContactItem> items = new ArrayList<>();
        for (RecentUserChatResponse response : responseList) {
            SelectableContactItem item = fromRecentUserChatResponse(response);
            if (item != null) {
                items.add(item);
            }
        }
        return items;
    }

    public static List<SelectableContactItem> fromContactResponseList(List<ContactResponse> responseList) {
        if (responseList == null) {
            return new ArrayList<>();
        }
        
        List<SelectableContactItem> items = new ArrayList<>();
        for (ContactResponse response : responseList) {
            SelectableContactItem item = fromContactResponse(response);
            if (item != null) {
                items.add(item);
            }
        }
        return items;
    }

    public static List<SelectableContactItem> mergeContactLists(List<SelectableContactItem> list1, List<SelectableContactItem> list2) {
        if (list1 == null && list2 == null) {
            return new ArrayList<>();
        }
        if (list1 == null) {
            return new ArrayList<>(list2);
        }
        if (list2 == null) {
            return new ArrayList<>(list1);
        }
        
        List<SelectableContactItem> merged = new ArrayList<>(list1);
        
        for (SelectableContactItem item2 : list2) {
            boolean exists = false;
            for (SelectableContactItem item1 : merged) {
                if (Objects.equals(item1.getUserId(), item2.getUserId())) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                merged.add(item2);
            }
        }
        
        return merged;
    }
}
