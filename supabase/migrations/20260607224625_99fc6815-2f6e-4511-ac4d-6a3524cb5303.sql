UPDATE auth.users
SET encrypted_password = crypt('Hioutz2026!', gen_salt('bf')),
    updated_at = now()
WHERE email = 'muetze-burg@web.de';