package com.dangngulon.frontend.feature.zola.presentation.mapper;

import com.dangngulon.frontend.feature.zola.domain.model.Contact;
import com.dangngulon.frontend.feature.zola.domain.model.RecentUserChat;
import com.dangngulon.frontend.feature.zola.presentation.model.SelectableContactItem;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class ContactMapper {

    private ContactMapper() {}

    public static SelectableContactItem fromRecentUserChat(RecentUserChat response) {
        return ZolaUiMapper.fromRecentUserChat(response);
    }

    public static SelectableContactItem fromContact(Contact response) {
        return ZolaUiMapper.fromContact(response);
    }

    public static List<SelectableContactItem> fromRecentUserChatList(List<RecentUserChat> responseList) {
        if (responseList == null) {
            return new ArrayList<>();
        }

        List<SelectableContactItem> items = new ArrayList<>();
        for (RecentUserChat response : responseList) {
            SelectableContactItem item = fromRecentUserChat(response);
            if (item != null) {
                items.add(item);
            }
        }
        return items;
    }

    public static List<SelectableContactItem> fromContactList(List<Contact> responseList) {
        if (responseList == null) {
            return new ArrayList<>();
        }

        List<SelectableContactItem> items = new ArrayList<>();
        for (Contact response : responseList) {
            SelectableContactItem item = fromContact(response);
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
