import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { api } from "@/api/client";
import { authApi } from "@/features/auth/api/auth.api";
import { ENDPOINTS } from "@/constants/endpoints";
import { ENV } from "@/config/env";
import { ApiError } from "@/types/api";
import * as SecureStore from "expo-secure-store";

const envelope = <T>(data: T) => ({
  success: true,
  code: "OK",
  message: "Thành công",
  data,
});

const TOKENS = {
  accessToken: "at-1",
  accessTokenExpiresAt: "2026-10-02T00:00:00.000Z",
  refreshToken: "rt-1",
  refreshTokenExpiresAt: "2026-10-08T00:00:00.000Z",
};

const USER = {
  id: "u1",
  email: "a@b.c",
  name: "Lan",
  role: "USER",
  tier: "FREE",
};

describe("authApi (migrated to the http wrapper)", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
  });

  it("builds the Google OAuth url with the mobile platform and redirect uri", () => {
    const url = authApi.googleAuthUrl();

    expect(url).toBe(
      `${ENV.API_URL}${ENDPOINTS.AUTH.GOOGLE}?platform=mobile&redirect_uri=${encodeURIComponent(
        ENV.OAUTH_REDIRECT_SCHEME,
      )}`,
    );
  });

  describe("token-returning calls", () => {
    it("login posts credentials and returns unwrapped tokens + user", async () => {
      mock.onPost(ENDPOINTS.AUTH.LOGIN).reply((config) => {
        expect(JSON.parse(config.data)).toEqual({
          email: "a@b.c",
          password: "pw",
        });
        return [200, envelope({ ...TOKENS, user: USER })];
      });

      await expect(
        authApi.login({ email: "a@b.c", password: "pw" }),
      ).resolves.toEqual({
        ...TOKENS,
        user: USER,
      });
    });

    it("register posts name, email and password", async () => {
      mock.onPost(ENDPOINTS.AUTH.REGISTER).reply((config) => {
        expect(JSON.parse(config.data)).toEqual({
          email: "a@b.c",
          password: "pw",
          confirmPassword: "pw",
          name: "Lan",
        });
        return [200, envelope({ ...TOKENS, user: USER })];
      });

      const res = await authApi.register({
        email: "a@b.c",
        password: "pw",
        name: "Lan",
      });
      expect(res.user).toEqual(USER);
    });

    it("exchangeOAuthCode posts the authorization code", async () => {
      mock.onPost(ENDPOINTS.AUTH.EXCHANGE).reply((config) => {
        expect(JSON.parse(config.data)).toEqual({ code: "auth-code" });
        return [200, envelope({ ...TOKENS, user: USER })];
      });

      const res = await authApi.exchangeOAuthCode("auth-code");
      expect(res.accessToken).toBe("at-1");
    });
  });

  describe("user reads", () => {
    it("getCurrentUser hits /users/me and unwraps the user", async () => {
      mock.onGet(ENDPOINTS.USERS.ME).reply(200, envelope(USER));

      await expect(authApi.getCurrentUser()).resolves.toEqual(USER);
    });

    it("getCurrentUser forwards an abort signal", async () => {
      const controller = new AbortController();
      mock.onGet(ENDPOINTS.USERS.ME).reply((config) => {
        expect(config.signal).toBe(controller.signal);
        return [200, envelope(USER)];
      });

      await authApi.getCurrentUser({ signal: controller.signal });
    });

    it("getUserQuota sends the action param when given", async () => {
      mock.onGet(ENDPOINTS.USERS.QUOTA).reply((config) => {
        expect(config.params).toEqual({ action: "TRY_ON" });
        return [200, envelope({ action: "TRY_ON", remaining: 2, limit: 5 })];
      });

      await expect(authApi.getUserQuota("TRY_ON")).resolves.toEqual({
        action: "TRY_ON",
        remaining: 2,
        limit: 5,
      });
    });

    it("getUserQuota sends no params when no action is given", async () => {
      mock.onGet(ENDPOINTS.USERS.QUOTA).reply((config) => {
        expect(config.params).toBeUndefined();
        return [200, envelope({ TRY_ON: { remaining: 2 } })];
      });

      await authApi.getUserQuota();
    });
  });

  describe("message-only calls", () => {
    const cases: [string, () => Promise<unknown>, string][] = [
      [
        "forgotPassword",
        () => authApi.forgotPassword("a@b.c"),
        ENDPOINTS.AUTH.FORGOT_PASSWORD,
      ],
      [
        "resetPassword",
        () => authApi.resetPassword("tk", "pw"),
        ENDPOINTS.AUTH.RESET_PASSWORD,
      ],
      [
        "verifyEmail",
        () => authApi.verifyEmail("tk"),
        ENDPOINTS.AUTH.VERIFY_EMAIL,
      ],
      [
        "resendVerification",
        () => authApi.resendVerification(),
        ENDPOINTS.AUTH.RESEND_VERIFICATION,
      ],
      [
        "changePassword",
        () => authApi.changePassword("old", "new"),
        ENDPOINTS.AUTH.CHANGE_PASSWORD,
      ],
    ];

    it.each(cases)(
      "%s posts to its endpoint and unwraps the message",
      async (_name, call, url) => {
        mock.onPost(url).reply(200, envelope({ message: "Đã gửi" }));

        await expect(call()).resolves.toEqual({ message: "Đã gửi" });
      },
    );

    it("sends the expected bodies", async () => {
      const bodies: Record<string, unknown> = {};
      mock.onPost(/.*/).reply((config) => {
        bodies[config.url!] = config.data ? JSON.parse(config.data) : undefined;
        return [200, envelope({})];
      });

      await authApi.forgotPassword("a@b.c");
      await authApi.resetPassword("tk", "pw-new");
      await authApi.verifyEmail("tk");
      await authApi.changePassword("old", "new");

      expect(bodies[ENDPOINTS.AUTH.FORGOT_PASSWORD]).toEqual({
        email: "a@b.c",
      });
      expect(bodies[ENDPOINTS.AUTH.RESET_PASSWORD]).toEqual({
        token: "tk",
        newPassword: "pw-new",
      });
      expect(bodies[ENDPOINTS.AUTH.VERIFY_EMAIL]).toEqual({ token: "tk" });
      expect(bodies[ENDPOINTS.AUTH.CHANGE_PASSWORD]).toEqual({
        currentPassword: "old",
        newPassword: "new",
      });
    });
  });

  describe("logout", () => {
    it("posts the refresh token", async () => {
      mock.onPost(ENDPOINTS.AUTH.LOGOUT).reply((config) => {
        expect(JSON.parse(config.data)).toEqual({ refreshToken: "rt-1" });
        return [200, envelope(null)];
      });

      await expect(authApi.logout("rt-1")).resolves.toBeUndefined();
    });

    it("still resolves when the backend fails, so local logout can proceed", async () => {
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      mock.onPost(ENDPOINTS.AUTH.LOGOUT).reply(500, {
        success: false,
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "Lỗi hệ thống",
      });

      await expect(authApi.logout("rt-1")).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalled();
    });

    it("logoutAll swallows backend failures too", async () => {
      jest.spyOn(console, "warn").mockImplementation(() => {});
      mock.onPost(ENDPOINTS.AUTH.LOGOUT_ALL).networkError();

      await expect(authApi.logoutAll()).resolves.toBeUndefined();
    });
  });

  describe("error propagation", () => {
    it("rejects with ApiError carrying the backend code", async () => {
      mock.onPost(ENDPOINTS.AUTH.LOGIN).reply(401, {
        success: false,
        statusCode: 401,
        code: "INVALID_CREDENTIALS",
        message: "Email hoặc mật khẩu không đúng.",
      });

      const error: ApiError = await authApi
        .login({ email: "a@b.c", password: "bad" })
        .catch((e) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe("INVALID_CREDENTIALS");
      expect(error.statusCode).toBe(401);
    });
  });

  describe("401 auto-refresh still works through the wrapper", () => {
    it("refreshes the access token and retries the original request", async () => {
      await SecureStore.setItemAsync("fashionai_access_token", "at-expired");
      await SecureStore.setItemAsync("fashionai_refresh_token", "rt-1");

      // /auth/refresh is called on the bare axios instance, bypassing `api` interceptors.
      const refreshMock = new MockAdapter(axios);
      refreshMock
        .onPost(`${ENV.API_URL}${ENDPOINTS.AUTH.REFRESH}`)
        .reply(200, envelope({ ...TOKENS, accessToken: "at-2" }));

      let attempts = 0;
      mock.onGet(ENDPOINTS.USERS.ME).reply((config) => {
        attempts += 1;
        if (attempts === 1) {
          return [
            401,
            {
              success: false,
              statusCode: 401,
              code: "ACCESS_TOKEN_EXPIRED",
              message: "hết hạn",
            },
          ];
        }
        expect(config.headers?.Authorization).toBe("Bearer at-2");
        return [200, envelope(USER)];
      });

      await expect(authApi.getCurrentUser()).resolves.toEqual(USER);
      expect(attempts).toBe(2);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "fashionai_access_token",
        "at-2",
      );

      refreshMock.restore();
    });
  });
});
