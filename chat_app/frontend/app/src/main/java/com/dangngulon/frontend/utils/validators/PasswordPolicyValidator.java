package com.dangngulon.frontend.utils.validators;

public class PasswordPolicyValidator {

    private PasswordPolicyValidator() {}

    public static boolean validate(String password) {
        if (password.length() < 8) {
            return false;
        }

        if (!password.matches(".*[A-Z].*")) {
           return false;
        }

        if (!password.matches(".*\\d.*")) {
           return false;
        }

        return true;
    }

}
