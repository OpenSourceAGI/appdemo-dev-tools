import "./index2.js";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { eq } from "drizzle-orm";
import "stripe";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, oneTap } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import { P as PUBLIC_DOMAIN } from "./customize-site.js";
import "resend";
import TTLCache from "@isaacs/ttlcache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { svelteKitHandler } from "better-auth/svelte-kit";
function sequence(...handlers) {
  const length = handlers.length;
  if (!length) return ({ event, resolve }) => resolve(event);
  return ({ event, resolve }) => {
    return apply_handle(0, event, {});
    function apply_handle(i, event2, parent_options) {
      const handle2 = handlers[i];
      return handle2({
        event: event2,
        resolve: (event3, options) => {
          const transformPageChunk = async ({ html, done }) => {
            if (options?.transformPageChunk) {
              html = await options.transformPageChunk({ html, done }) ?? "";
            }
            if (parent_options?.transformPageChunk) {
              html = await parent_options.transformPageChunk({ html, done }) ?? "";
            }
            return html;
          };
          const filterSerializedResponseHeaders = parent_options?.filterSerializedResponseHeaders ?? options?.filterSerializedResponseHeaders;
          const preload = parent_options?.preload ?? options?.preload;
          return i < length - 1 ? apply_handle(i + 1, event3, {
            transformPageChunk,
            filterSerializedResponseHeaders,
            preload
          }) : resolve(event3, { transformPageChunk, filterSerializedResponseHeaders, preload });
        }
      });
    }
  };
}
const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  cite: text("cite").notNull(),
  html: text("html").notNull(),
  url: text("url").notNull(),
  author: text("author"),
  author_cite: text("author_cite").notNull(),
  author_type: integer("author_type"),
  date: text("date"),
  title: text("title"),
  source: text("source"),
  word_count: integer("word_count").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
});
const messages = sqliteTable("messages", {
  id: integer("id").primaryKey(),
  content: text("content").default(""),
  chatId: text("chatId").default(""),
  messageId: text("messageId").default(""),
  role: text("type", { enum: ["assistant", "user"] }),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
});
const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
  title: text("title").default(""),
  createdAt: text("createdAt").default(""),
  focusMode: text("focusMode").default("")
});
const userFavorites = sqliteTable("user_favorites", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  articleId: text("articleId").notNull().references(() => articles.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
});
const userMemories = sqliteTable("user_memories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  memoryType: text("memory_type").notNull(),
  content: text("content").notNull(),
  importance: integer("importance").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(/* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(/* @__PURE__ */ new Date())
});
const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  title: text("title").default(""),
  public: integer("public", { mode: "boolean" }).default(false),
  ownerId: text("ownerId").notNull().references(() => user.id, { onDelete: "cascade" }),
  content: text("content").default(""),
  metadata: text("metadata", { mode: "json" }),
  sharedUserIds: text("shared_user_ids", { mode: "json" }).default("[]"),
  sharedTeamIds: text("shared_team_ids", { mode: "json" }).default("[]"),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
});
const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").default(""),
  users: text("users", { mode: "json" }).default("[]"),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
  ownerId: text("ownerId").notNull().references(() => user.id, { onDelete: "cascade" }),
  metadata: text("metadata", { mode: "json" })
});
const userFileIndex = sqliteTable("user_file_index", {
  userId: text("user_id").default("").primaryKey(),
  fileIds: text("file_ids", { mode: "json" }).default("[]"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
});
const user = sqliteTable("user", {
  settings: text("settings").default(""),
  subscription: text("subscription").default(""),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).$defaultFn(() => false).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
});
const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" })
});
const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp"
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp"
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});
const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date()
  )
});
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  account,
  articles,
  chats,
  files,
  messages,
  session,
  teams,
  user,
  userFavorites,
  userFileIndex,
  userMemories,
  verification
}, Symbol.toStringTag, { value: "Module" }));
async function validateApiKey(db, apiKey) {
  const user2 = await db.query.user.findFirst({
    where: (
      // @ts-ignore
      eq(user2.apiKey, apiKey)
    )
  });
  return !!user2;
}
const SESSION_DURATION_IN_DAYS = 60;
let auth;
const createAuth = (env) => {
  auth = betterAuth({
    database: drizzleAdapter(drizzle(env.DB, { schema }), {
      provider: "sqlite"
      // generateId: () => crypto.randomUUID(),
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: PUBLIC_DOMAIN,
    session: {
      expiresIn: SESSION_DURATION_IN_DAYS * 24 * 60 * 60,
      // Convert to seconds
      updateAge: 24 * 60 * 60
      // Update session every 24 hours
    },
    socialProviders: {
      google: {
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET
      },
      discord: {
        clientId: env.AUTH_DISCORD_ID,
        clientSecret: env.AUTH_DISCORD_SECRET
      },
      github: {
        clientId: env.AUTH_GITHUB_ID,
        clientSecret: env.AUTH_GITHUB_SECRET
      },
      microsoft: {
        clientId: env.AUTH_MICROSOFT_ENTRA_ID_ID,
        clientSecret: env.AUTH_MICROSOFT_ENTRA_ID_SECRET
      },
      facebook: {
        clientId: env.AUTH_FACEBOOK_ID,
        clientSecret: env.AUTH_FACEBOOK_SECRET
      }
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false
    },
    emailVerification: {
      sendOnSignUp: false,
      autoSignInAfterVerification: true
    },
    plugins: [
      openAPI(),
      oneTap()
    ],
    advanced: {
      crossSubDomainCookies: {
        enabled: true
      }
    }
  });
  return auth;
};
const initDatabase = async ({ event, resolve }) => {
  event.locals.db = drizzle(event.platform?.env.DB, { schema });
  return resolve(event);
};
let defaultHashFunction;
if (globalThis?.crypto?.subtle) {
  defaultHashFunction = subtleSha256;
}
async function subtleSha256(str) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
class CookieRateLimiter {
  rate;
  cookieOptions;
  secret;
  requirePreflight;
  cookieId;
  hashFunction;
  constructor(options) {
    this.cookieId = options.name;
    this.secret = options.secret;
    this.rate = options.rate;
    this.requirePreflight = options.preflight;
    this.hashFunction = options.hashFunction ?? defaultHashFunction;
    this.cookieOptions = {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "strict",
      ...options.serializeOptions
    };
  }
  async hash(event) {
    const currentId = await this.userIdFromCookie(event.cookies.get(this.cookieId), event);
    return currentId ? currentId : false;
  }
  async preflight(event) {
    const data = event.cookies.get(this.cookieId);
    if (data) {
      const userId2 = await this.userIdFromCookie(data, event);
      if (userId2)
        return userId2;
    }
    const userId = nanoid();
    event.cookies.set(this.cookieId, userId + ";" + await this.hashFunction(this.secret + userId), this.cookieOptions);
    return userId;
  }
  async userIdFromCookie(cookie, event) {
    const empty = () => {
      return this.requirePreflight ? null : this.preflight(event);
    };
    if (!cookie)
      return empty();
    const [userId, secretHash] = cookie.split(";");
    if (!userId || !secretHash)
      return empty();
    if (await this.hashFunction(this.secret + userId) != secretHash) {
      return empty();
    }
    return userId;
  }
}
class IPRateLimiter {
  rate;
  constructor(rate) {
    this.rate = rate;
  }
  async hash(event) {
    return event.getClientAddress();
  }
}
class IPUserAgentRateLimiter {
  rate;
  constructor(rate) {
    this.rate = rate;
  }
  async hash(event) {
    const ua = event.request.headers.get("user-agent");
    if (!ua)
      return false;
    return event.getClientAddress() + ua;
  }
}
class TTLStore {
  cache;
  constructor(maxTTL, maxItems = Infinity) {
    this.cache = new TTLCache({
      ttl: maxTTL,
      max: maxItems,
      noUpdateTTL: true
    });
  }
  async clear() {
    return this.cache.clear();
  }
  async add(hash, ttl) {
    const currentRate = this.cache.get(hash) ?? 0;
    return this.set(hash, currentRate + 1, ttl);
  }
  set(hash, rate, ttl) {
    this.cache.set(hash, rate, { ttl });
    return rate;
  }
}
function TTLTime(unit) {
  switch (unit) {
    case "s":
      return 1e3;
    case "m":
      return 6e4;
    case "h":
      return 60 * 6e4;
    case "2s":
      return 2e3;
    case "5s":
      return 5e3;
    case "10s":
      return 1e4;
    case "15s":
      return 15e3;
    case "30s":
      return 3e4;
    case "45s":
      return 45e3;
    case "2m":
      return 2 * 6e4;
    case "5m":
      return 5 * 6e4;
    case "10m":
      return 10 * 6e4;
    case "15m":
      return 15 * 6e4;
    case "30m":
      return 30 * 6e4;
    case "45m":
      return 45 * 6e4;
    case "100ms":
      return 100;
    case "250ms":
      return 250;
    case "500ms":
      return 500;
    case "2h":
      return 2 * 60 * 6e4;
    case "6h":
      return 6 * 60 * 6e4;
    case "12h":
      return 12 * 60 * 6e4;
    case "d":
      return 24 * 60 * 6e4;
    case "ms":
      return 1;
  }
  throw new Error("Invalid unit for TTLTime: " + unit);
}
class RateLimiter {
  store;
  plugins;
  onLimited;
  hashFunction;
  cookieLimiter;
  async isLimited(event, extraData) {
    return (await this._isLimited(event, extraData)).limited;
  }
  /**
   * Clear all rate limits.
   */
  async clear() {
    return await this.store.clear();
  }
  /**
   * Check if a request event is rate limited.
   * @param {RequestEvent} event
   * @returns {Promise<boolean>} true if request is limited, false otherwise
   */
  async _isLimited(event, extraData) {
    let limited = void 0;
    for (let i = 0; i < this.plugins.length; i++) {
      const plugin = this.plugins[i];
      const rate = plugin.rate;
      const id = await plugin.limiter.hash(event, extraData);
      if (id === false) {
        if (this.onLimited) {
          const status = await this.onLimited(event, "rejected");
          if (status === true)
            return { limited: false, hash: null, ttl: rate[1] };
        }
        return { limited: true, hash: null, ttl: rate[1] };
      } else if (id === null) {
        if (limited === void 0)
          limited = true;
        continue;
      } else {
        limited = false;
      }
      if (!id) {
        throw new Error("Empty hash returned from rate limiter " + plugin.constructor.name);
      }
      if (id === true) {
        return { limited: false, hash: null, ttl: rate[1] };
      }
      const hash = i.toString() + await this.hashFunction(id);
      const currentRate = await this.store.add(hash, rate[1]);
      if (currentRate > rate[0]) {
        if (this.onLimited) {
          const status = await this.onLimited(event, "rate");
          if (status === true)
            return { limited: false, hash, ttl: rate[1] };
        }
        return { limited: true, hash, ttl: rate[1] };
      }
    }
    return {
      limited: limited ?? false,
      hash: null,
      ttl: this.plugins[this.plugins.length - 1].rate[1]
    };
  }
  constructor(options = {}) {
    this.onLimited = options.onLimited;
    this.hashFunction = options.hashFunction ?? defaultHashFunction;
    if (!this.hashFunction) {
      throw new Error("No RateLimiter hash function found. Please set one with the hashFunction option.");
    }
    function mapPluginRates(limiter) {
      if (!limiter.rate.length)
        throw new Error(`Empty rate for limiter ${limiter.constructor.name}`);
      const pluginRates = Array.isArray(limiter.rate[0]) ? limiter.rate : [limiter.rate];
      return pluginRates.map((rate) => ({
        rate: [rate[0], TTLTime(rate[1])],
        limiter
      }));
    }
    this.plugins = (options.plugins ?? []).flatMap(mapPluginRates);
    const IPRates = options.IP ?? options.rates?.IP;
    if (IPRates) {
      this.plugins = this.plugins.concat(mapPluginRates(new IPRateLimiter(IPRates)));
    }
    const IPUARates = options.IPUA ?? options.rates?.IPUA;
    if (IPUARates) {
      this.plugins = this.plugins.concat(mapPluginRates(new IPUserAgentRateLimiter(IPUARates)));
    }
    const cookieRates = options.cookie ?? options.rates?.cookie;
    if (cookieRates) {
      this.plugins = this.plugins.concat(mapPluginRates(this.cookieLimiter = new CookieRateLimiter({
        hashFunction: this.hashFunction,
        ...cookieRates
      })));
    }
    if (!this.plugins.length) {
      throw new Error("No plugins set for RateLimiter!");
    }
    this.plugins.sort((a, b) => {
      const diff = a.rate[1] - b.rate[1];
      return diff == 0 ? a.rate[0] - b.rate[0] : diff;
    });
    const maxTTL = this.plugins.reduce((acc, plugin) => {
      const rate = plugin.rate[1];
      if (rate == 1) {
        console.warn('RateLimiter: The "ms" unit is not reliable due to OS timing issues.');
      }
      return Math.max(rate, acc);
    }, 0);
    this.store = options.store ?? new TTLStore(maxTTL, options.maxItems);
  }
}
class RetryAfterStore {
  cache;
  constructor(maxItems = Infinity) {
    this.cache = new TTLCache({
      max: maxItems,
      noUpdateTTL: true
    });
  }
  async clear() {
    return this.cache.clear();
  }
  async add(hash, ttl) {
    const currentRate = this.cache.get(hash);
    if (currentRate)
      return this.cache.get(hash) ?? 0;
    const retryAfter = Date.now() + ttl;
    this.cache.set(hash, retryAfter, { ttl });
    return retryAfter;
  }
}
class RetryAfterRateLimiter extends RateLimiter {
  retryAfter;
  constructor(options = {}, retryAfterStore) {
    super(options);
    this.retryAfter = retryAfterStore ?? new RetryAfterStore();
  }
  static toSeconds(rateMs) {
    return Math.max(0, Math.floor(rateMs / 1e3));
  }
  /**
   * Clear all rate limits.
   */
  async clear() {
    await this.retryAfter.clear();
    return await super.clear();
  }
  /**
   * Check if a request event is rate limited.
   * @param {RequestEvent} event
   * @returns {Promise<limited: boolean, retryAfter: number>} Rate limit status for the event.
   */
  async check(event, extraData) {
    const result = await this._isLimited(event, extraData);
    if (!result.limited)
      return { limited: false, retryAfter: 0 };
    if (result.hash === null) {
      return {
        limited: true,
        retryAfter: RetryAfterRateLimiter.toSeconds(result.ttl)
      };
    }
    const retryAfter = RetryAfterRateLimiter.toSeconds(await this.retryAfter.add(result.hash, result.ttl) - Date.now());
    return { limited: true, retryAfter };
  }
}
new RetryAfterRateLimiter({
  IP: [5, "h"],
  IPUA: [5, "h"]
});
new RetryAfterRateLimiter({
  IP: [5, "s"],
  IPUA: [5, "s"]
});
new RetryAfterRateLimiter({
  IP: [5, "h"],
  IPUA: [5, "h"]
});
new RetryAfterRateLimiter({
  IP: [30, "s"],
  IPUA: [30, "s"]
});
new RetryAfterRateLimiter({
  IP: [1, "h"],
  IPUA: [1, "h"]
});
new RetryAfterRateLimiter({
  IP: [30, "s"],
  IPUA: [30, "s"]
});
new RetryAfterRateLimiter({
  IP: [5, "h"],
  IPUA: [5, "h"]
});
new RetryAfterRateLimiter({
  IP: [5, "s"],
  IPUA: [5, "s"]
});
new RetryAfterRateLimiter({
  IP: [3, "h"],
  IPUA: [3, "h"]
});
new RetryAfterRateLimiter({
  IP: [3, "h"],
  IPUA: [3, "h"]
});
new RetryAfterRateLimiter({
  IP: [3, "h"],
  IPUA: [3, "h"]
});
const USERNAME_MIN_LEN = 3;
const USERNAME_MAX_LEN = 20;
const PASSWORD_MIN_LEN = 6;
const PASSWORD_MAX_LEN = 50;
const NAME_MIN_LEN = 3;
const NAME_MAX_LEN = 50;
const EMAIL_MIN_LEN = 6;
const EMAIL_MAX_LEN = 50;
const USER_ID_LEN = 15;
const TOKEN_LEN = 15;
const emailField = z.string({ required_error: "Email is required" }).trim().email({ message: "Email must be a valid email address" }).min(EMAIL_MIN_LEN, {
  message: `Email must be at least ${EMAIL_MIN_LEN} characters`
}).max(EMAIL_MAX_LEN, {
  message: `Email must not exceed ${EMAIL_MAX_LEN} characters`
});
z.boolean().default(false);
z.boolean().default(false);
const nameField = z.string({ required_error: "Name is required" }).trim().min(NAME_MIN_LEN, {
  message: `Name must be at least ${NAME_MIN_LEN} characters`
}).max(NAME_MAX_LEN, {
  message: `Name must be at least ${NAME_MAX_LEN} characters`
});
const passwordConfirmField = z.string({
  required_error: "Password confirm is required"
});
const passwordConfirmMustBeEqualToPassword = ({ password, passwordConfirm }, ctx) => {
  if (passwordConfirm.length > 0 && password !== passwordConfirm) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password and password confirm must match",
      path: ["password"]
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password and password confirm must match",
      path: ["passwordConfirm"]
    });
  }
};
const passwordRegex = new RegExp(
  `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*"'()+,\\-./:;<=>?[\\]^_\`{|}~])[A-Za-z0-9!@#$%^&*"'()+,\\-./:;<=>?[\\]^_\`{|}~]{${PASSWORD_MIN_LEN},${PASSWORD_MAX_LEN}}$`
);
const passwordField = z.string({ required_error: "Password is required" }).regex(passwordRegex, { message: "Password is invalid." }).min(PASSWORD_MIN_LEN, {
  message: `Password minimum length is ${PASSWORD_MIN_LEN}`
}).max(PASSWORD_MAX_LEN, {
  message: `Password max length is ${PASSWORD_MAX_LEN}`
});
const tokenField = z.string({ required_error: "Token is required." }).trim().length(TOKEN_LEN, { message: `Token must be ${TOKEN_LEN} characters` });
const userIdField = z.string({ required_error: "UserId is required" }).trim().length(USER_ID_LEN, {
  message: `User id must be ${USER_ID_LEN} characters`
});
const usernameField = z.string({ required_error: "Username is valid." }).trim().min(USERNAME_MIN_LEN, {
  message: `Username must be at least ${USERNAME_MIN_LEN} characters`
}).max(USERNAME_MAX_LEN, {
  message: `Username must be max ${USERNAME_MAX_LEN} characters`
});
z.object({
  email: emailField,
  password: passwordField
});
z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  passwordConfirm: passwordConfirmField
}).superRefine(passwordConfirmMustBeEqualToPassword);
z.object({
  token: tokenField
});
z.object({
  email: emailField
});
z.object({
  token: tokenField
});
z.object({
  email: emailField
});
z.object({
  token: tokenField
});
z.object({
  password: passwordField,
  passwordConfirm: passwordConfirmField
}).superRefine(passwordConfirmMustBeEqualToPassword);
z.object({
  name: nameField
});
z.object({
  name: nameField
});
z.object({
  username: usernameField
});
z.object({
  token: tokenField
});
z.object({
  userId: userIdField
});
z.object({
  name: nameField
});
var authInstance;
async function handleAuth({ event, resolve }) {
  if (!authInstance)
    authInstance = createAuth(event.platform?.env);
  return svelteKitHandler({ event, resolve, auth: authInstance });
}
const authHandler = async ({ event, resolve }) => {
  const env = event.platform?.env;
  const auth2 = createAuth(env);
  authInstance = auth2;
  return svelteKitHandler({ event, resolve, auth: auth2 });
};
const allowCORSAccessAPI = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api/") || event.url.pathname.startsWith("/.well")) {
    const apiKey = event.request.headers.get("X-API-Key");
    const user2 = event.locals.user;
    let isAuthorized = false;
    const origin = event.request.headers.get("Origin");
    const isSameOrigin = origin && event.url.origin === origin;
    if (isSameOrigin || user2) {
      isAuthorized = true;
    } else if (apiKey) {
      isAuthorized = await validateApiKey(event.locals.db, apiKey);
    }
    if (!isAuthorized) {
      return new Response("Unauthorized", { status: 401 });
    }
    if (event.request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization"
        }
      });
    }
    const response = await resolve(event);
    response.headers.append("Access-Control-Allow-Origin", "*");
    response.headers.append(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    response.headers.append(
      "Access-Control-Allow-Headers",
      "Content-Type, X-API-Key, Authorization"
    );
    return response;
  }
  return resolve(event);
};
const handle = sequence(
  initDatabase,
  authHandler,
  allowCORSAccessAPI
);
export {
  allowCORSAccessAPI,
  handle,
  handleAuth
};
