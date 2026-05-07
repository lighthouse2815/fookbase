---
config:
  layout: elk
---
erDiagram
	direction TB
	USER_AUTH_PROVIDERS {
		uuid user_id PK ""  
		string provider PK ""  
	}

	USER_PROFILES {
		uuid id PK ""  
		uuid user_id FK ""  
		string email UK ""  
		string phone_number UK ""  
		string display_name  ""  
		datetime created_at  ""  
		datetime deleted_at  ""  
	}

	USER_PROFILE_INFO_VISIBILITY {
		uuid id PK ""  
		uuid user_id FK ""  
		boolean display_name_visible  ""  
		boolean phone_visible  ""  
		boolean email_visible  ""  
	}

	REFRESH_TOKENS {
		uuid id PK ""  
		uuid user_id FK ""  
		uuid family_id  ""  
		string token_hash  ""  
		datetime expires_at  ""  
		datetime revoked_at  ""  
	}

	OTPS {
		uuid id PK ""  
		uuid user_id FK ""  
		string otp_code  ""  
		string type  ""  
		datetime expired_at  ""  
		datetime used_at  ""  
	}

	FRIENDSHIPS {
		uuid id PK ""  
		uuid requester_id FK ""  
		uuid addressee_id FK ""  
		string status  ""  
		datetime created_at  ""  
	}

	CONTACTS {
		uuid id PK ""  
		uuid owner_id FK ""  
		uuid target_id FK ""  
		boolean blocked  ""  
		datetime created_at  ""  
		datetime deleted_at  ""  
	}

	USERS {
		uuid id PK ""  
		string username UK ""  
		string role  ""  
		string status  ""  
		datetime created_at  ""  
		datetime deleted_at  ""  
	}

	POST {
		uuid id PK ""  
		uuid user_id FK ""  
		string content  ""  
		datetime created_at  ""  
		datetime deleted_at  ""  
	}

	COMMENT {
		uuid id PK ""  
		uuid post_id FK ""  
		uuid parent_comment_id FK ""  
		uuid user_id FK ""  
		string content  ""  
		datetime created_at  ""  
		datetime deleted_at  ""  
	}

	LIKE {
		uuid id PK ""  
		uuid post_id FK ""  
		uuid user_id FK ""  
		string type  ""  
		datetime created_at  ""  
	}

	COMMENT_REACTION {
		uuid id PK ""  
		uuid comment_id FK ""  
		uuid user_id FK ""  
		string type  ""  
		datetime created_at  ""  
	}

	HASHTAG {
		uuid id PK ""  
		string normalized_name UK ""  
	}

	POST_HASHTAG {
		uuid post_id PK ""  
		uuid hashtag_id PK ""  
		datetime created_at  ""  
	}

	POST_MEDIA {
		uuid id PK ""  
		uuid post_id FK ""  
		string media_url  ""  
		string media_type  ""  
		int sort_order  ""  
	}

	SAVED_POST {
		uuid id PK ""  
		uuid post_id FK ""  
		uuid user_id FK ""  
		datetime created_at  ""  
	}

	STORY {
		uuid id PK ""  
		uuid user_id FK ""  
		string media_url  ""  
		string media_type  ""  
		datetime expired_at  ""  
		boolean is_deleted  ""  
	}

	STORY_REACTION {
		uuid id PK ""  
		uuid story_id FK ""  
		uuid user_id FK ""  
		string type  ""  
		datetime created_at  ""  
	}

	STORY_VIEW {
		uuid id PK ""  
		uuid story_id FK ""  
		uuid viewer_id FK ""  
		datetime viewed_at  ""  
	}

	COMMENT_REPORT {
		uuid id PK ""  
		uuid comment_id FK ""  
		uuid post_id FK ""  
		uuid reported_by_user_id FK ""  
		string status  ""  
		datetime created_at  ""  
	}

	POST_REPORT {
		uuid id PK ""  
		uuid post_id FK ""  
		uuid reported_by_user_id FK ""  
		string status  ""  
		datetime created_at  ""  
	}

	STORY_REPORT {
		uuid id PK ""  
		uuid story_id FK ""  
		uuid reported_by_user_id FK ""  
		string status  ""  
		datetime created_at  ""  
	}

	USER_REPORT {
		uuid id PK ""  
		uuid target_user_id FK ""  
		uuid reported_by_user_id FK ""  
		string status  ""  
		datetime created_at  ""  
	}

	CONVERSATIONS {
		uuid id PK ""  
		string type  ""  
		uuid created_by FK ""  
		uuid last_message_id  ""  
		uuid last_sender_id  ""  
		datetime last_message_at  ""  
	}

	CONVERSATION_MEMBERS {
		uuid id PK ""  
		uuid conversation_id FK ""  
		uuid user_id FK ""  
		string role  ""  
		datetime joined_at  ""  
		datetime left_at  ""  
	}

	MESSAGES {
		uuid id PK ""  
		uuid conversation_id FK ""  
		uuid sender_id FK ""  
		string type  ""  
		string content  ""  
		datetime created_at  ""  
		datetime deleted_at  ""  
	}

	ATTACHMENTS {
		uuid id PK ""  
		uuid message_id FK ""  
		string file_url  ""  
		string file_type  ""  
		bigint file_size  ""  
		datetime created_at  ""  
	}

	MESSAGE_STATUS {
		uuid id PK ""  
		uuid message_id FK ""  
		uuid user_id FK ""  
		string status  ""  
		datetime created_at  ""  
	}

	NOTIFICATION {
		uuid id PK ""  
		uuid user_id FK ""  
		uuid actor_user_id FK ""  
		uuid post_id FK ""  
		uuid comment_id FK ""  
		string type  ""  
		boolean is_read  ""  
		datetime created_at  ""  
	}

	APP_REVIEW {
		uuid id PK ""  
		uuid user_id FK ""  
		int rating  ""  
		boolean is_hidden  ""  
		datetime created_at  ""  
	}

	ADMIN_AUDIT_LOG {
		uuid id PK ""  
		uuid admin_user_id FK ""  
		uuid target_user_id FK ""  
		string action_type  ""  
		string entity_type  ""  
		datetime created_at  ""  
	}

	CONVERSATIONS||--o{CONVERSATION_MEMBERS:"members"
	CONVERSATIONS||--o{MESSAGES:"messages"
	MESSAGES||--o{ATTACHMENTS:"has"
	MESSAGES||--o{MESSAGE_STATUS:"status"
	POST||--o{COMMENT:"comments"
	COMMENT||--o{COMMENT:"replies"
	COMMENT||--o{COMMENT_REACTION:"reactions"
	POST||--o{POST_MEDIA:"media"
	POST||--o{LIKE:"liked"
	HASHTAG||--o{POST_HASHTAG:"used_in"
	POST||--o{POST_HASHTAG:"tags"
	POST||--o{SAVED_POST:"saved"
	POST||--o{POST_REPORT:"reported"
	COMMENT||--o{COMMENT_REPORT:"reported"
	POST||--o{COMMENT_REPORT:"context_post"
	STORY||--o{STORY_REACTION:"reactions"
	STORY||--o{STORY_VIEW:"views"
	STORY||--o{STORY_REPORT:"reported"
	POST||--o{NOTIFICATION:"post_ref"
	COMMENT||--o{NOTIFICATION:"comment_ref"

	USER_AUTH_PROVIDERS}o--||USERS:"belongs_to"
	USER_PROFILES||--||USERS:"profile_of"
	USER_PROFILE_INFO_VISIBILITY||--||USERS:"privacy_of"
	REFRESH_TOKENS}o--||USERS:"token_of"
	OTPS}o--||USERS:"otp_of"
	FRIENDSHIPS}o--||USERS:"requester"
	FRIENDSHIPS}o--||USERS:"addressee"
	CONTACTS}o--||USERS:"owner"
	CONTACTS}o--||USERS:"target"
	CONVERSATIONS}o--||USERS:"created_by"
	CONVERSATION_MEMBERS}o--||USERS:"member_user"
	MESSAGES}o--||USERS:"sender"
	MESSAGE_STATUS}o--||USERS:"receipt_user"
	POST}o--||USERS:"author"
	COMMENT}o--||USERS:"author"
	LIKE}o--||USERS:"liked_by"
	COMMENT_REACTION}o--||USERS:"reacted_by"
	SAVED_POST}o--||USERS:"saved_by"
	POST_REPORT}o--||USERS:"reporter"
	COMMENT_REPORT}o--||USERS:"reporter"
	STORY}o--||USERS:"owner"
	STORY_REACTION}o--||USERS:"reacted_by"
	STORY_VIEW}o--||USERS:"viewer"
	STORY_REPORT}o--||USERS:"reporter"
	USER_REPORT}o--||USERS:"target_user"
	USER_REPORT}o--||USERS:"reported_by"
	NOTIFICATION}o--||USERS:"recipient"
	NOTIFICATION}o--||USERS:"actor"
	APP_REVIEW}o--||USERS:"review_by"
	ADMIN_AUDIT_LOG}o--||USERS:"admin"
	ADMIN_AUDIT_LOG}o--||USERS:"target_user"

	classDef user fill:#fff4cc,stroke:#d79b00,stroke-width:2px,color:#1f2937
	classDef auth fill:#eaf3ff,stroke:#4f8cc9,stroke-width:1px,color:#1f2937
	classDef social fill:#f0f9ff,stroke:#0ea5e9,stroke-width:1px,color:#1f2937
	classDef content fill:#eefcf2,stroke:#22a06b,stroke-width:1px,color:#1f2937
	classDef story fill:#fff1f2,stroke:#e11d48,stroke-width:1px,color:#1f2937
	classDef report fill:#fff7ed,stroke:#ea580c,stroke-width:1px,color:#1f2937
	classDef message fill:#f3f0ff,stroke:#7c3aed,stroke-width:1px,color:#1f2937
	classDef system fill:#f5f5f5,stroke:#6b7280,stroke-width:1px,color:#111827

	USERS:::user
	USER_AUTH_PROVIDERS:::user
	USER_PROFILES:::user
	USER_PROFILE_INFO_VISIBILITY:::user
	REFRESH_TOKENS:::auth
	OTPS:::auth
	FRIENDSHIPS:::social
	CONTACTS:::social
	POST:::content
	COMMENT:::content
	LIKE:::content
	COMMENT_REACTION:::content
	HASHTAG:::content
	POST_HASHTAG:::content
	POST_MEDIA:::content
	SAVED_POST:::content
	STORY:::story
	STORY_REACTION:::story
	STORY_VIEW:::story
	COMMENT_REPORT:::report
	POST_REPORT:::report
	STORY_REPORT:::report
	USER_REPORT:::report
	CONVERSATIONS:::message
	CONVERSATION_MEMBERS:::message
	MESSAGES:::message
	ATTACHMENTS:::message
	MESSAGE_STATUS:::message
	NOTIFICATION:::system
	APP_REVIEW:::system
	ADMIN_AUDIT_LOG:::system
