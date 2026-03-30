# Users................................................................................................................

INSERT INTO users (
    id, username, password, role, status, created_at, updated_at, deleted_at
) VALUES
-- ADMIN
(UNHEX(REPLACE(UUID(),'-','')), 'admin',        '$2a$10$pw_admin', 'ADMIN', 'ACTIVE',   NOW(), NOW(), NULL),

-- USER ACTIVE
(UNHEX(REPLACE(UUID(),'-','')), 'dang',         '$2a$10$pw1',      'USER',  'ACTIVE',   NOW(), NOW(), NULL),
(UNHEX(REPLACE(UUID(),'-','')), 'user01',       '$2a$10$pw2',      'USER',  'ACTIVE',   NOW(), NOW(), NULL),
(UNHEX(REPLACE(UUID(),'-','')), 'user02',       '$2a$10$pw3',      'USER',  'ACTIVE',   NOW(), NOW(), NULL),
(UNHEX(REPLACE(UUID(),'-','')), 'user03',       '$2a$10$pw4',      'USER',  'ACTIVE',   NOW(), NOW(), NULL),
(UNHEX(REPLACE(UUID(),'-','')), 'user04',       '$2a$10$pw5',      'USER',  'ACTIVE',   NOW(), NOW(), NULL),
(UNHEX(REPLACE(UUID(),'-','')), 'user05',       '$2a$10$pw6',      'USER',  'ACTIVE',   NOW(), NOW(), NULL),
(UNHEX(REPLACE(UUID(),'-','')), 'user06',       '$2a$10$pw7',      'USER',  'ACTIVE',   NOW(), NOW(), NULL),

-- USER INACTIVE
(UNHEX(REPLACE(UUID(),'-','')), 'inactive01',   '$2a$10$pw8',      'USER',  'INACTIVE', NOW(), NOW(), NULL),
(UNHEX(REPLACE(UUID(),'-','')), 'inactive02',   '$2a$10$pw9',      'USER',  'INACTIVE', NOW(), NOW(), NULL),
(UNHEX(REPLACE(UUID(),'-','')), 'inactive03',   '$2a$10$pw10',     'USER',  'INACTIVE', NOW(), NOW(), NULL),

-- USER BANNED
(UNHEX(REPLACE(UUID(),'-','')), 'banned01',     '$2a$10$pw11',     'USER',  'BANNED',      NOW(), NOW(), NULL),
(UNHEX(REPLACE(UUID(),'-','')), 'banned02',     '$2a$10$pw12',     'USER',  'BANNED',      NOW(), NOW(), NULL),
(UNHEX(REPLACE(UUID(),'-','')), 'banned03',     '$2a$10$pw13',     'USER',  'BANNED',      NOW(), NOW(), NULL),

-- USER SOFT DELETED
(UNHEX(REPLACE(UUID(),'-','')), 'old_user01',   '$2a$10$pw14',     'USER',  'INACTIVE', NOW(), NOW(), NOW()),
(UNHEX(REPLACE(UUID(),'-','')), 'old_user02',   '$2a$10$pw15',     'USER',  'INACTIVE', NOW(), NOW(), NOW()),
(UNHEX(REPLACE(UUID(),'-','')), 'old_user03',   '$2a$10$pw16',     'USER',  'INACTIVE', NOW(), NOW(), NOW()),

-- USER HỖN HỢP
(UNHEX(REPLACE(UUID(),'-','')), 'test01',       '$2a$10$pw17',     'USER',  'ACTIVE',   NOW(), NOW(), NULL),
(UNHEX(REPLACE(UUID(),'-','')), 'test02',       '$2a$10$pw18',     'USER',  'ACTIVE',   NOW(), NOW(), NULL),
(UNHEX(REPLACE(UUID(),'-','')), 'test03',       '$2a$10$pw19',     'USER',  'ACTIVE',   NOW(), NOW(), NULL);


# UserProfile.............................................................................................................

INSERT INTO user_profiles (
    id,
    user_id,
    last_name,
    first_name,
    birth_date,
    gender,
    phone_number,
    email,
    display_name,
    avatar_url,
    completed,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    UNHEX(REPLACE(UUID(),'-',''))                        AS id,
    u.id                                                 AS user_id,
    p.last_name,
    p.first_name,
    p.birth_date,
    p.gender,
    p.phone_number,
    p.email,
    p.display_name,
    p.avatar_url,
    p.completed,
    NOW()                                                AS created_at,
    NOW()                                                AS updated_at,
    p.deleted_at
FROM users u
         JOIN (
    SELECT 'admin'        username, 'Nguyen' last_name, 'Admin' first_name, '1995-01-01' birth_date, 'OTHER' gender, '0900000001' phone_number, 'admin@mail.com' email, 'Admin' display_name, NULL avatar_url, true completed, NULL deleted_at UNION ALL
    SELECT 'dang',         'Nguyen', 'Dang',  '2002-05-10', 'MALE',   '0900000002', 'dang@mail.com',  'Dang',  NULL, true, NULL UNION ALL
    SELECT 'user01',       'Tran',   'User1', '2000-01-01', 'MALE',   '0900000003', 'user01@mail.com','User1',NULL, true, NULL UNION ALL
    SELECT 'user02',       'Tran',   'User2', '2000-02-02', 'FEMALE', '0900000004', 'user02@mail.com','User2',NULL, true, NULL UNION ALL
    SELECT 'user03',       'Le',     'User3', '2000-03-03', 'MALE',   '0900000005', 'user03@mail.com','User3',NULL, true, NULL UNION ALL
    SELECT 'user04',       'Le',     'User4', '2000-04-04', 'FEMALE', '0900000006', 'user04@mail.com','User4',NULL, true, NULL UNION ALL
    SELECT 'user05',       'Pham',   'User5', '2000-05-05', 'MALE',   '0900000007', 'user05@mail.com','User5',NULL, true, NULL UNION ALL
    SELECT 'user06',       'Pham',   'User6', '2000-06-06', 'FEMALE', '0900000008', 'user06@mail.com','User6',NULL, true, NULL UNION ALL

    SELECT 'inactive01',   'Vo',     'Ina1',  '1999-01-01', 'OTHER',  '0900000009', 'inactive01@mail.com','Ina1',NULL,false,NULL UNION ALL
    SELECT 'inactive02',   'Vo',     'Ina2',  '1999-02-02', 'MALE',   '0900000010', 'inactive02@mail.com','Ina2',NULL,false,NULL UNION ALL
    SELECT 'inactive03',   'Vo',     'Ina3',  '1999-03-03', 'FEMALE', '0900000011', 'inactive03@mail.com','Ina3',NULL,false,NULL UNION ALL

    SELECT 'banned01',     'Do',     'Ban1',  '1998-01-01', 'MALE',   '0900000012', 'banned01@mail.com','Ban1',NULL,true,NULL UNION ALL
    SELECT 'banned02',     'Do',     'Ban2',  '1998-02-02', 'FEMALE', '0900000013', 'banned02@mail.com','Ban2',NULL,true,NULL UNION ALL
    SELECT 'banned03',     'Do',     'Ban3',  '1998-03-03', 'OTHER',  '0900000014', 'banned03@mail.com','Ban3',NULL,true,NULL UNION ALL

    SELECT 'old_user01',   'Ly',     'Old1',  '1990-01-01', 'MALE',   '0900000015', 'old01@mail.com','Old1',NULL,true, NOW() UNION ALL
    SELECT 'old_user02',   'Ly',     'Old2',  '1990-02-02', 'FEMALE', '0900000016', 'old02@mail.com','Old2',NULL,true, NOW() UNION ALL
    SELECT 'old_user03',   'Ly',     'Old3',  '1990-03-03', 'OTHER',  '0900000017', 'old03@mail.com','Old3',NULL,true, NOW() UNION ALL

    SELECT 'test01',       'Test',   'One',   '2001-01-01', 'MALE',   '0900000018', 'test01@mail.com','Test1',NULL,true,NULL UNION ALL
    SELECT 'test02',       'Test',   'Two',   '2001-02-02', 'FEMALE', '0900000019', 'test02@mail.com','Test2',NULL,true,NULL UNION ALL
    SELECT 'test03',       'Test',   'Three', '2001-03-03', 'OTHER',  '0900000020', 'test03@mail.com','Test3',NULL,true,NULL
) p ON u.username = p.username;
