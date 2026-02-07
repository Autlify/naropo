module.exports=[423502,(e,t,n)=>{},918622,(e,t,n)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},270406,(e,t,n)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},254799,(e,t,n)=>{t.exports=e.x("crypto",()=>require("crypto"))},750227,(e,t,n)=>{t.exports=e.x("node:path",()=>require("node:path"))},857764,(e,t,n)=>{t.exports=e.x("node:url",()=>require("node:url"))},784941,(e,t,n)=>{t.exports=e.x("@prisma/client-2c3a283f134fdcb6/runtime/client",()=>require("@prisma/client-2c3a283f134fdcb6/runtime/client"))},193695,(e,t,n)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},442315,(e,t,n)=>{"use strict";t.exports=e.r(918622)},347540,(e,t,n)=>{"use strict";t.exports=e.r(442315).vendored["react-rsc"].React},819481,(e,t,n)=>{"use strict";var r=Object.defineProperty,i=Object.getOwnPropertyDescriptor,a=Object.getOwnPropertyNames,s=Object.prototype.hasOwnProperty,o={},c={RequestCookies:()=>y,ResponseCookies:()=>A,parseCookie:()=>l,parseSetCookie:()=>p,stringifyCookie:()=>u};for(var d in c)r(o,d,{get:c[d],enumerable:!0});function u(e){var t;let n=["path"in e&&e.path&&`Path=${e.path}`,"expires"in e&&(e.expires||0===e.expires)&&`Expires=${("number"==typeof e.expires?new Date(e.expires):e.expires).toUTCString()}`,"maxAge"in e&&"number"==typeof e.maxAge&&`Max-Age=${e.maxAge}`,"domain"in e&&e.domain&&`Domain=${e.domain}`,"secure"in e&&e.secure&&"Secure","httpOnly"in e&&e.httpOnly&&"HttpOnly","sameSite"in e&&e.sameSite&&`SameSite=${e.sameSite}`,"partitioned"in e&&e.partitioned&&"Partitioned","priority"in e&&e.priority&&`Priority=${e.priority}`].filter(Boolean),r=`${e.name}=${encodeURIComponent(null!=(t=e.value)?t:"")}`;return 0===n.length?r:`${r}; ${n.join("; ")}`}function l(e){let t=new Map;for(let n of e.split(/; */)){if(!n)continue;let e=n.indexOf("=");if(-1===e){t.set(n,"true");continue}let[r,i]=[n.slice(0,e),n.slice(e+1)];try{t.set(r,decodeURIComponent(null!=i?i:"true"))}catch{}}return t}function p(e){if(!e)return;let[[t,n],...r]=l(e),{domain:i,expires:a,httponly:s,maxage:o,path:c,samesite:d,secure:u,partitioned:p,priority:y}=Object.fromEntries(r.map(([e,t])=>[e.toLowerCase().replace(/-/g,""),t]));{var A,E,g={name:t,value:decodeURIComponent(n),domain:i,...a&&{expires:new Date(a)},...s&&{httpOnly:!0},..."string"==typeof o&&{maxAge:Number(o)},path:c,...d&&{sameSite:I.includes(A=(A=d).toLowerCase())?A:void 0},...u&&{secure:!0},...y&&{priority:f.includes(E=(E=y).toLowerCase())?E:void 0},...p&&{partitioned:!0}};let e={};for(let t in g)g[t]&&(e[t]=g[t]);return e}}t.exports=((e,t,n,o)=>{if(t&&"object"==typeof t||"function"==typeof t)for(let n of a(t))s.call(e,n)||void 0===n||r(e,n,{get:()=>t[n],enumerable:!(o=i(t,n))||o.enumerable});return e})(r({},"__esModule",{value:!0}),o);var I=["strict","lax","none"],f=["low","medium","high"],y=class{constructor(e){this._parsed=new Map,this._headers=e;const t=e.get("cookie");if(t)for(const[e,n]of l(t))this._parsed.set(e,{name:e,value:n})}[Symbol.iterator](){return this._parsed[Symbol.iterator]()}get size(){return this._parsed.size}get(...e){let t="string"==typeof e[0]?e[0]:e[0].name;return this._parsed.get(t)}getAll(...e){var t;let n=Array.from(this._parsed);if(!e.length)return n.map(([e,t])=>t);let r="string"==typeof e[0]?e[0]:null==(t=e[0])?void 0:t.name;return n.filter(([e])=>e===r).map(([e,t])=>t)}has(e){return this._parsed.has(e)}set(...e){let[t,n]=1===e.length?[e[0].name,e[0].value]:e,r=this._parsed;return r.set(t,{name:t,value:n}),this._headers.set("cookie",Array.from(r).map(([e,t])=>u(t)).join("; ")),this}delete(e){let t=this._parsed,n=Array.isArray(e)?e.map(e=>t.delete(e)):t.delete(e);return this._headers.set("cookie",Array.from(t).map(([e,t])=>u(t)).join("; ")),n}clear(){return this.delete(Array.from(this._parsed.keys())),this}[Symbol.for("edge-runtime.inspect.custom")](){return`RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(e=>`${e.name}=${encodeURIComponent(e.value)}`).join("; ")}},A=class{constructor(e){var t,n,r;this._parsed=new Map,this._headers=e;const i=null!=(r=null!=(n=null==(t=e.getSetCookie)?void 0:t.call(e))?n:e.get("set-cookie"))?r:[];for(const e of Array.isArray(i)?i:function(e){if(!e)return[];var t,n,r,i,a,s=[],o=0;function c(){for(;o<e.length&&/\s/.test(e.charAt(o));)o+=1;return o<e.length}for(;o<e.length;){for(t=o,a=!1;c();)if(","===(n=e.charAt(o))){for(r=o,o+=1,c(),i=o;o<e.length&&"="!==(n=e.charAt(o))&&";"!==n&&","!==n;)o+=1;o<e.length&&"="===e.charAt(o)?(a=!0,o=i,s.push(e.substring(t,r)),t=o):o=r+1}else o+=1;(!a||o>=e.length)&&s.push(e.substring(t,e.length))}return s}(i)){const t=p(e);t&&this._parsed.set(t.name,t)}}get(...e){let t="string"==typeof e[0]?e[0]:e[0].name;return this._parsed.get(t)}getAll(...e){var t;let n=Array.from(this._parsed.values());if(!e.length)return n;let r="string"==typeof e[0]?e[0]:null==(t=e[0])?void 0:t.name;return n.filter(e=>e.name===r)}has(e){return this._parsed.has(e)}set(...e){let[t,n,r]=1===e.length?[e[0].name,e[0].value,e[0]]:e,i=this._parsed;return i.set(t,function(e={name:"",value:""}){return"number"==typeof e.expires&&(e.expires=new Date(e.expires)),e.maxAge&&(e.expires=new Date(Date.now()+1e3*e.maxAge)),(null===e.path||void 0===e.path)&&(e.path="/"),e}({name:t,value:n,...r})),function(e,t){for(let[,n]of(t.delete("set-cookie"),e)){let e=u(n);t.append("set-cookie",e)}}(i,this._headers),this}delete(...e){let[t,n]="string"==typeof e[0]?[e[0]]:[e[0].name,e[0]];return this.set({...n,name:t,value:"",expires:new Date(0)})}[Symbol.for("edge-runtime.inspect.custom")](){return`ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(u).join("; ")}}},974389,e=>{"use strict";var t=e.i(67982);e.s(["Prisma",0,t])},192345,249866,e=>{"use strict";var t=e.i(254799);function n(e=32){return t.default.randomBytes(e).toString("hex")}function r(e){return t.default.createHash("sha256").update(e).digest("hex")}function i(e,n){return t.default.createHmac("sha256",e).update(n).digest("hex")}function a(e,n){let r=Buffer.from(e,"hex"),i=Buffer.from(n,"hex");return r.length===i.length&&t.default.timingSafeEqual(r,i)}function s(){let e=process.env.AUTLIFY_ENCRYPTION_KEY;if(!e)return null;if(/^[0-9a-fA-F]{64}$/.test(e))return Buffer.from(e,"hex");try{let t=Buffer.from(e,"base64");if(32===t.length)return t}catch{}return null}function o(e){let n=s();if(!n)return null;let r=t.default.randomBytes(12),i=t.default.createCipheriv("aes-256-gcm",n,r),a=Buffer.concat([i.update(e,"utf8"),i.final()]),o=i.getAuthTag(),c=e=>e.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");return`v1.${c(r)}.${c(a)}.${c(o)}`}function c(e){let n=s();if(!n)return null;let r=String(e).split(".");if(4!==r.length||"v1"!==r[0])return null;let i=e=>{let t="=".repeat((4-e.length%4)%4),n=e.replace(/-/g,"+").replace(/_/g,"/")+t;return Buffer.from(n,"base64")},a=i(r[1]),o=i(r[2]),c=i(r[3]);try{let e=t.default.createDecipheriv("aes-256-gcm",n,a);return e.setAuthTag(c),Buffer.concat([e.update(o),e.final()]).toString("utf8")}catch{return null}}function d(){let e=`ak_${n(4)}`,t=n(32);return{apiKey:`${e}.${t}`,keyPrefix:e,keyHash:r(t)}}function u(e){let[t,n]=e.apiKey.split(".",2);return!!t&&!!n&&t===e.storedPrefix&&a(r(n),e.storedHash)}e.s(["decryptStringGcm",()=>c,"encryptStringGcm",()=>o,"hmacSha256Hex",()=>i,"randomToken",()=>n,"sha256Hex",()=>r,"timingSafeEqualHex",()=>a],249866),e.s(["generateIntegrationApiKey",()=>d,"verifyIntegrationApiKey",()=>u],192345)},569914,e=>{"use strict";e.i(423502);var t=e.i(843793);e.i(828189);var n=e.i(974389),r=e.i(192345);async function i(e){return"AGENCY"===e.type?await t.db.$queryRaw(n.Prisma.sql`SELECT "id","name","keyPrefix","createdAt","revokedAt","lastUsedAt"
                FROM "IntegrationApiKey"
                WHERE "agencyId" = ${e.agencyId} AND "subAccountId" IS NULL
                ORDER BY "createdAt" DESC`):await t.db.$queryRaw(n.Prisma.sql`SELECT "id","name","keyPrefix","createdAt","revokedAt","lastUsedAt"
              FROM "IntegrationApiKey"
              WHERE "subAccountId" = ${e.subAccountId}
              ORDER BY "createdAt" DESC`)}async function a(e){let{apiKey:i,keyPrefix:a,keyHash:s}=(0,r.generateIntegrationApiKey)(),o=h(),c="AGENCY"===e.scope.type?e.scope.agencyId:null,d="SUBACCOUNT"===e.scope.type?e.scope.subAccountId:null;return await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationApiKey"
      ("id","name","keyPrefix","keyHash","agencyId","subAccountId","createdByUserId","createdAt")
      VALUES
      (${o}, ${e.name}, ${a}, ${s}, ${c}, ${d}, ${e.createdByUserId??null}, now())`),{id:o,name:e.name,keyPrefix:a,apiKey:i}}async function s(e){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationApiKey" SET "revokedAt" = now() WHERE "id" = ${e}`)}async function o(e){return await t.db.$queryRaw(n.Prisma.sql`SELECT "id","connectionId","url","events","isActive","createdAt","updatedAt"
              FROM "IntegrationWebhookSubscription"
              WHERE "connectionId" = ${e}
              ORDER BY "createdAt" DESC`)}async function c(e){let r=h();return await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationWebhookSubscription"
      ("id","connectionId","url","secretHash","secretEnc","events","isActive","createdAt","updatedAt")
      VALUES
      (${r}, ${e.connectionId}, ${e.url}, ${e.secretHash??null}, ${e.secretEnc??null}, ${e.events}, true, now(), now())`),r}async function d(e,r){let i=r.url??null,a=r.events??null,s=r.isActive??null;await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationWebhookSubscription"
      SET
        "url" = COALESCE(${i}, "url"),
        "events" = COALESCE(${a}, "events"),
        "isActive" = COALESCE(${s}, "isActive"),
        "updatedAt" = now()
      WHERE "id" = ${e}`)}async function u(e){await t.db.$executeRaw(n.Prisma.sql`DELETE FROM "IntegrationWebhookSubscription" WHERE "id" = ${e}`)}async function l(e){let r="AGENCY"===e.scope.type?e.scope.agencyId:null,i="SUBACCOUNT"===e.scope.type?e.scope.subAccountId:null,a=await t.db.$queryRaw(n.Prisma.sql`SELECT "id"
              FROM "IntegrationConnection"
              WHERE "deletedAt" IS NULL
                AND "provider" = ${e.provider}
                AND "agencyId" IS NOT DISTINCT FROM ${r}
                AND "subAccountId" IS NOT DISTINCT FROM ${i}
              LIMIT 1`),s=a?.[0]?.id;if(s){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationConnection"
        SET
          "status" = COALESCE(${e.status??null}, "status"),
          "config" = COALESCE(${e.config??null}, "config"),
          "credentials" = COALESCE(${e.credentials??null}, "credentials"),
          "updatedAt" = now()
        WHERE "id" = ${s}`);let r=await t.db.$queryRaw(n.Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt"
                FROM "IntegrationConnection"
                WHERE "id" = ${s}
                LIMIT 1`);return r?.[0]??null}let o=h();await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationConnection"
      ("id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt")
      VALUES
      (${o}, ${e.provider}, ${e.status??"DISCONNECTED"}, ${r}, ${i}, ${e.config??null}, ${e.credentials??null}, now(), now())`);let c=await t.db.$queryRaw(n.Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt"
              FROM "IntegrationConnection"
              WHERE "id" = ${o}
              LIMIT 1`);return c?.[0]??null}async function p(e,r){let i=r.status??null,a=r.config??null,s=r.credentials??null;await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationConnection"
      SET
        "status" = COALESCE(${i}, "status"),
        "config" = COALESCE(${a}, "config"),
        "credentials" = COALESCE(${s}, "credentials"),
        "updatedAt" = now()
      WHERE "id" = ${e} AND "deletedAt" IS NULL`)}async function I(e){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationConnection" SET "deletedAt" = now(), "updatedAt" = now() WHERE "id" = ${e}`)}async function f(e){let r=h();await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationProviderEvent"
      ("id","provider","connectionId","externalEventId","headers","payload","receivedAt")
      VALUES
      (${r}, ${e.provider}, ${e.connectionId}, ${e.externalEventId}, ${e.headers??null}, ${e.payload??null}, now())
      ON CONFLICT ("connectionId","externalEventId") DO NOTHING`);let i=await t.db.$queryRaw(n.Prisma.sql`SELECT "id","provider","connectionId","externalEventId","headers","payload","receivedAt","processedAt"
              FROM "IntegrationProviderEvent"
              WHERE "connectionId" = ${e.connectionId}
                AND "externalEventId" IS NOT DISTINCT FROM ${e.externalEventId}
              ORDER BY "receivedAt" DESC
              LIMIT 1`);return i?.[0]??null}async function y(e){let r=h();return await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationWebhookDelivery"
      ("id","subscriptionId","providerEventId","status","attemptCount","createdAt","updatedAt")
      VALUES
      (${r}, ${e.subscriptionId}, ${e.providerEventId??null}, 'PENDING', 0, now(), now())`),r}async function A(e){let r=h();return await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationWebhookDeliveryAttempt"
      ("id","deliveryId","statusCode","responseBody","error","durationMs","attemptedAt")
      VALUES
      (${r}, ${e.deliveryId}, ${e.statusCode??null}, ${e.responseBody??null}, ${e.error??null}, ${e.durationMs??null}, now())`),r}async function E(e,r){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationWebhookDelivery"
      SET "attemptCount" = "attemptCount" + 1,
          "status" = ${r},
          "updatedAt" = now()
      WHERE "id" = ${e}`)}async function g(e,r){let i=r?.limit??50;if("AGENCY"===e.type)return await t.db.$queryRaw(n.Prisma.sql`SELECT d."id", d."status", d."attemptCount", d."createdAt", s."url", c."provider", d."subscriptionId"
                FROM "IntegrationWebhookDelivery" d
                JOIN "IntegrationWebhookSubscription" s ON s."id" = d."subscriptionId"
                JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
                WHERE c."agencyId" = ${e.agencyId} AND c."subAccountId" IS NULL AND c."deletedAt" IS NULL
                ORDER BY d."createdAt" DESC
                LIMIT ${i}`);let a=await t.db.subAccount.findUnique({where:{id:e.subAccountId},select:{agencyId:!0}});return await t.db.$queryRaw(n.Prisma.sql`SELECT d."id", d."status", d."attemptCount", d."createdAt", s."url", c."provider", d."subscriptionId"
              FROM "IntegrationWebhookDelivery" d
              JOIN "IntegrationWebhookSubscription" s ON s."id" = d."subscriptionId"
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE c."deletedAt" IS NULL
                AND (
                  c."subAccountId" = ${e.subAccountId}
                  OR (c."agencyId" = ${a?.agencyId??null} AND c."subAccountId" IS NULL)
                )
              ORDER BY d."createdAt" DESC
              LIMIT ${i}`)}async function m(e,r){let i=n.Prisma.sql``;if(r?.type==="AGENCY")i=n.Prisma.sql` AND c."agencyId" = ${r.agencyId} AND c."subAccountId" IS NULL`;else if(r?.type==="SUBACCOUNT"){let e=await t.db.subAccount.findUnique({where:{id:r.subAccountId},select:{agencyId:!0}});i=n.Prisma.sql` AND (
      c."subAccountId" = ${r.subAccountId}
      OR (c."agencyId" = ${e?.agencyId??null} AND c."subAccountId" IS NULL)
    )`}let a=await t.db.$queryRaw(n.Prisma.sql`SELECT d.*, s."url" as "subscriptionUrl", c."provider" as "provider"
              FROM "IntegrationWebhookDelivery" d
              JOIN "IntegrationWebhookSubscription" s ON s."id" = d."subscriptionId"
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE d."id" = ${e}${i}
              LIMIT 1`),s=a?.[0]??null;return s?{delivery:s,attempts:await t.db.$queryRaw(n.Prisma.sql`SELECT "id","statusCode","responseBody","error","durationMs","attemptedAt"
              FROM "IntegrationWebhookDeliveryAttempt"
              WHERE "deliveryId" = ${e}
              ORDER BY "attemptedAt" DESC`)}:null}function h(){let t=globalThis;if(t?.crypto?.randomUUID)return t.crypto.randomUUID();try{let t=e.r(254799);if(t?.randomUUID)return t.randomUUID()}catch{}let n=[],r="0123456789abcdef";for(let e=0;e<36;e++)n[e]=r[Math.floor(16*Math.random())];return n[14]="4",n[19]=r[3&parseInt(n[19],16)|8],n[8]=n[13]=n[18]=n[23]="-",n.join("")}async function b(e){let r=await t.db.$queryRaw(n.Prisma.sql`SELECT s."id", s."connectionId", s."url", s."events", s."isActive", s."secretHash", s."secretEnc",
                     c."agencyId", c."subAccountId"
              FROM "IntegrationWebhookSubscription" s
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE s."id" = ${e}
              LIMIT 1`);return r?.[0]??null}async function $(e){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationWebhookSubscription"
              SET "secretHash" = ${e.secretHash}, "secretEnc" = ${e.secretEnc}, "updatedAt" = now()
              WHERE "id" = ${e.subscriptionId}`)}async function S(e){let r=await t.db.$queryRaw(n.Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","credentials","config","createdAt","updatedAt","deletedAt"
              FROM "IntegrationConnection"
              WHERE "id" = ${e} AND "deletedAt" IS NULL
              LIMIT 1`);return r?.[0]??null}e.s(["createApiKey",()=>a,"createAttempt",()=>A,"createDelivery",()=>y,"createProviderEventIdempotent",()=>f,"createSubscription",()=>c,"deleteConnection",()=>I,"deleteSubscription",()=>u,"getConnectionById",()=>S,"getDeliveryDetail",()=>m,"getSubscriptionWithScope",()=>b,"incrementDeliveryAttempt",()=>E,"listApiKeys",()=>i,"listDeliveries",()=>g,"listSubscriptions",()=>o,"revokeApiKey",()=>s,"updateConnectionById",()=>p,"updateSubscription",()=>d,"updateSubscriptionSecret",()=>$,"upsertConnection",()=>l])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__314a84aa._.js.map