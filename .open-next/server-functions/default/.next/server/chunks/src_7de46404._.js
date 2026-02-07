module.exports=[569914,e=>{"use strict";e.i(423502);var t=e.i(843793);e.i(828189);var n=e.i(974389),r=e.i(192345);async function i(e){return"AGENCY"===e.type?await t.db.$queryRaw(n.Prisma.sql`SELECT "id","name","keyPrefix","createdAt","revokedAt","lastUsedAt"
                FROM "IntegrationApiKey"
                WHERE "agencyId" = ${e.agencyId} AND "subAccountId" IS NULL
                ORDER BY "createdAt" DESC`):await t.db.$queryRaw(n.Prisma.sql`SELECT "id","name","keyPrefix","createdAt","revokedAt","lastUsedAt"
              FROM "IntegrationApiKey"
              WHERE "subAccountId" = ${e.subAccountId}
              ORDER BY "createdAt" DESC`)}async function s(e){let{apiKey:i,keyPrefix:s,keyHash:a}=(0,r.generateIntegrationApiKey)(),c=f(),o="AGENCY"===e.scope.type?e.scope.agencyId:null,d="SUBACCOUNT"===e.scope.type?e.scope.subAccountId:null;return await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationApiKey"
      ("id","name","keyPrefix","keyHash","agencyId","subAccountId","createdByUserId","createdAt")
      VALUES
      (${c}, ${e.name}, ${s}, ${a}, ${o}, ${d}, ${e.createdByUserId??null}, now())`),{id:c,name:e.name,keyPrefix:s,apiKey:i}}async function a(e){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationApiKey" SET "revokedAt" = now() WHERE "id" = ${e}`)}async function c(e){return await t.db.$queryRaw(n.Prisma.sql`SELECT "id","connectionId","url","events","isActive","createdAt","updatedAt"
              FROM "IntegrationWebhookSubscription"
              WHERE "connectionId" = ${e}
              ORDER BY "createdAt" DESC`)}async function o(e){let r=f();return await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationWebhookSubscription"
      ("id","connectionId","url","secretHash","secretEnc","events","isActive","createdAt","updatedAt")
      VALUES
      (${r}, ${e.connectionId}, ${e.url}, ${e.secretHash??null}, ${e.secretEnc??null}, ${e.events}, true, now(), now())`),r}async function d(e,r){let i=r.url??null,s=r.events??null,a=r.isActive??null;await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationWebhookSubscription"
      SET
        "url" = COALESCE(${i}, "url"),
        "events" = COALESCE(${s}, "events"),
        "isActive" = COALESCE(${a}, "isActive"),
        "updatedAt" = now()
      WHERE "id" = ${e}`)}async function u(e){await t.db.$executeRaw(n.Prisma.sql`DELETE FROM "IntegrationWebhookSubscription" WHERE "id" = ${e}`)}async function l(e){let r="AGENCY"===e.scope.type?e.scope.agencyId:null,i="SUBACCOUNT"===e.scope.type?e.scope.subAccountId:null,s=await t.db.$queryRaw(n.Prisma.sql`SELECT "id"
              FROM "IntegrationConnection"
              WHERE "deletedAt" IS NULL
                AND "provider" = ${e.provider}
                AND "agencyId" IS NOT DISTINCT FROM ${r}
                AND "subAccountId" IS NOT DISTINCT FROM ${i}
              LIMIT 1`),a=s?.[0]?.id;if(a){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationConnection"
        SET
          "status" = COALESCE(${e.status??null}, "status"),
          "config" = COALESCE(${e.config??null}, "config"),
          "credentials" = COALESCE(${e.credentials??null}, "credentials"),
          "updatedAt" = now()
        WHERE "id" = ${a}`);let r=await t.db.$queryRaw(n.Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt"
                FROM "IntegrationConnection"
                WHERE "id" = ${a}
                LIMIT 1`);return r?.[0]??null}let c=f();await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationConnection"
      ("id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt")
      VALUES
      (${c}, ${e.provider}, ${e.status??"DISCONNECTED"}, ${r}, ${i}, ${e.config??null}, ${e.credentials??null}, now(), now())`);let o=await t.db.$queryRaw(n.Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt"
              FROM "IntegrationConnection"
              WHERE "id" = ${c}
              LIMIT 1`);return o?.[0]??null}async function I(e,r){let i=r.status??null,s=r.config??null,a=r.credentials??null;await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationConnection"
      SET
        "status" = COALESCE(${i}, "status"),
        "config" = COALESCE(${s}, "config"),
        "credentials" = COALESCE(${a}, "credentials"),
        "updatedAt" = now()
      WHERE "id" = ${e} AND "deletedAt" IS NULL`)}async function y(e){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationConnection" SET "deletedAt" = now(), "updatedAt" = now() WHERE "id" = ${e}`)}async function A(e){let r=f();await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationProviderEvent"
      ("id","provider","connectionId","externalEventId","headers","payload","receivedAt")
      VALUES
      (${r}, ${e.provider}, ${e.connectionId}, ${e.externalEventId}, ${e.headers??null}, ${e.payload??null}, now())
      ON CONFLICT ("connectionId","externalEventId") DO NOTHING`);let i=await t.db.$queryRaw(n.Prisma.sql`SELECT "id","provider","connectionId","externalEventId","headers","payload","receivedAt","processedAt"
              FROM "IntegrationProviderEvent"
              WHERE "connectionId" = ${e.connectionId}
                AND "externalEventId" IS NOT DISTINCT FROM ${e.externalEventId}
              ORDER BY "receivedAt" DESC
              LIMIT 1`);return i?.[0]??null}async function g(e){let r=f();return await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationWebhookDelivery"
      ("id","subscriptionId","providerEventId","status","attemptCount","createdAt","updatedAt")
      VALUES
      (${r}, ${e.subscriptionId}, ${e.providerEventId??null}, 'PENDING', 0, now(), now())`),r}async function p(e){let r=f();return await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationWebhookDeliveryAttempt"
      ("id","deliveryId","statusCode","responseBody","error","durationMs","attemptedAt")
      VALUES
      (${r}, ${e.deliveryId}, ${e.statusCode??null}, ${e.responseBody??null}, ${e.error??null}, ${e.durationMs??null}, now())`),r}async function E(e,r){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationWebhookDelivery"
      SET "attemptCount" = "attemptCount" + 1,
          "status" = ${r},
          "updatedAt" = now()
      WHERE "id" = ${e}`)}async function w(e,r){let i=r?.limit??50;if("AGENCY"===e.type)return await t.db.$queryRaw(n.Prisma.sql`SELECT d."id", d."status", d."attemptCount", d."createdAt", s."url", c."provider", d."subscriptionId"
                FROM "IntegrationWebhookDelivery" d
                JOIN "IntegrationWebhookSubscription" s ON s."id" = d."subscriptionId"
                JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
                WHERE c."agencyId" = ${e.agencyId} AND c."subAccountId" IS NULL AND c."deletedAt" IS NULL
                ORDER BY d."createdAt" DESC
                LIMIT ${i}`);let s=await t.db.subAccount.findUnique({where:{id:e.subAccountId},select:{agencyId:!0}});return await t.db.$queryRaw(n.Prisma.sql`SELECT d."id", d."status", d."attemptCount", d."createdAt", s."url", c."provider", d."subscriptionId"
              FROM "IntegrationWebhookDelivery" d
              JOIN "IntegrationWebhookSubscription" s ON s."id" = d."subscriptionId"
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE c."deletedAt" IS NULL
                AND (
                  c."subAccountId" = ${e.subAccountId}
                  OR (c."agencyId" = ${s?.agencyId??null} AND c."subAccountId" IS NULL)
                )
              ORDER BY d."createdAt" DESC
              LIMIT ${i}`)}async function b(e,r){let i=n.Prisma.sql``;if(r?.type==="AGENCY")i=n.Prisma.sql` AND c."agencyId" = ${r.agencyId} AND c."subAccountId" IS NULL`;else if(r?.type==="SUBACCOUNT"){let e=await t.db.subAccount.findUnique({where:{id:r.subAccountId},select:{agencyId:!0}});i=n.Prisma.sql` AND (
      c."subAccountId" = ${r.subAccountId}
      OR (c."agencyId" = ${e?.agencyId??null} AND c."subAccountId" IS NULL)
    )`}let s=await t.db.$queryRaw(n.Prisma.sql`SELECT d.*, s."url" as "subscriptionUrl", c."provider" as "provider"
              FROM "IntegrationWebhookDelivery" d
              JOIN "IntegrationWebhookSubscription" s ON s."id" = d."subscriptionId"
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE d."id" = ${e}${i}
              LIMIT 1`),a=s?.[0]??null;return a?{delivery:a,attempts:await t.db.$queryRaw(n.Prisma.sql`SELECT "id","statusCode","responseBody","error","durationMs","attemptedAt"
              FROM "IntegrationWebhookDeliveryAttempt"
              WHERE "deliveryId" = ${e}
              ORDER BY "attemptedAt" DESC`)}:null}function f(){let t=globalThis;if(t?.crypto?.randomUUID)return t.crypto.randomUUID();try{let t=e.r(254799);if(t?.randomUUID)return t.randomUUID()}catch{}let n=[],r="0123456789abcdef";for(let e=0;e<36;e++)n[e]=r[Math.floor(16*Math.random())];return n[14]="4",n[19]=r[3&parseInt(n[19],16)|8],n[8]=n[13]=n[18]=n[23]="-",n.join("")}async function m(e){let r=await t.db.$queryRaw(n.Prisma.sql`SELECT s."id", s."connectionId", s."url", s."events", s."isActive", s."secretHash", s."secretEnc",
                     c."agencyId", c."subAccountId"
              FROM "IntegrationWebhookSubscription" s
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE s."id" = ${e}
              LIMIT 1`);return r?.[0]??null}async function h(e){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationWebhookSubscription"
              SET "secretHash" = ${e.secretHash}, "secretEnc" = ${e.secretEnc}, "updatedAt" = now()
              WHERE "id" = ${e.subscriptionId}`)}async function S(e){let r=await t.db.$queryRaw(n.Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","credentials","config","createdAt","updatedAt","deletedAt"
              FROM "IntegrationConnection"
              WHERE "id" = ${e} AND "deletedAt" IS NULL
              LIMIT 1`);return r?.[0]??null}e.s(["createApiKey",()=>s,"createAttempt",()=>p,"createDelivery",()=>g,"createProviderEventIdempotent",()=>A,"createSubscription",()=>o,"deleteConnection",()=>y,"deleteSubscription",()=>u,"getConnectionById",()=>S,"getDeliveryDetail",()=>b,"getSubscriptionWithScope",()=>m,"incrementDeliveryAttempt",()=>E,"listApiKeys",()=>i,"listDeliveries",()=>w,"listSubscriptions",()=>c,"revokeApiKey",()=>a,"updateConnectionById",()=>I,"updateSubscription",()=>d,"updateSubscriptionSecret",()=>h,"upsertConnection",()=>l])},661418,e=>{"use strict";e.i(423502),e.i(551783);var t=e.i(379509),n=e.i(73903),r=e.i(698902),i=e.i(254799),s=e.i(843793);let a="autl_",c=async e=>{var t,n;let r,c,o,d=(e=>{let t=e.trim();if(!t)return null;if(t.startsWith(a)){let[e,n]=t.slice(a.length).split("_",2);return e&&n?{prefix:e,secret:n}:null}if(t.includes(".")){let[e,n]=t.split(".",2);return e&&n?{prefix:e,secret:n}:null}return null})(e.token);if(!d)return null;let u=await s.db.apiKey.findUnique({where:{prefix:d.prefix},select:{id:!0,kind:!0,ownerUserId:!0,agencyId:!0,subAccountId:!0,allowedSubAccountIds:!0,permissionKeys:!0,secretHash:!0,expiresAt:!0,revokedAt:!0}});return!u||u.revokedAt||u.expiresAt&&u.expiresAt.getTime()<=Date.now()?null:(r=d.secret,t=i.default.createHash("sha256").update(r,"utf8").digest("hex"),n=u.secretHash,c=Buffer.from(t,"hex"),o=Buffer.from(n,"hex"),c.length===o.length&&i.default.timingSafeEqual(c,o))?((e.touchLastUsedAt??!0)&&s.db.apiKey.update({where:{id:u.id},data:{lastUsedAt:new Date}}).catch(()=>null),{id:u.id,kind:u.kind,ownerUserId:u.ownerUserId,agencyId:u.agencyId,subAccountId:u.subAccountId,allowedSubAccountIds:u.allowedSubAccountIds??[],permissionKeys:u.permissionKeys??[],expiresAt:u.expiresAt,revokedAt:u.revokedAt}):null},o=(e,t)=>{let n=e.get(t);if(n)return n;let r=t.toLowerCase();if(r!==t){let t=e.get(r);if(t)return t}return null},d=async e=>{let t=(e=>{let t=e.get("authorization")||e.get("Authorization");if(!t)return null;let n=t.trim().split(/\s+/,2);return 2!==n.length||"bearer"!==n[0].toLowerCase()?null:n[1]})(e.headers)||o(e.headers,"x-autlify-api-key");if(t){let e=await c({token:t});return e?{kind:"apiKey",apiKeyId:e.id,apiKeyKind:e.kind,ownerUserId:e.ownerUserId,agencyId:e.agencyId,subAccountId:e.subAccountId,allowedSubAccountIds:e.allowedSubAccountIds,permissionKeys:e.permissionKeys}:null}let n=await (0,r.auth)(),i=n?.user?.id;return i?{kind:"user",userId:i}:null};class u extends Error{status;code;constructor(e){super(e.message),this.name="AutlifyContextError",this.status=e.status,this.code=e.code}}let l=async e=>{let t=await s.db.subAccount.findUnique({where:{id:e.subAccountId},select:{agencyId:!0}});return!!t&&t.agencyId===e.agencyId},I=async e=>{let t,r,i=o(t=e.headers,"x-autlify-agency-id")||o(t,"x-autlify-agency"),a=o(r=e.headers,"x-autlify-subaccount-id")||o(r,"x-autlify-subaccount"),c=async e=>{let t=await (0,n.resolveAgencyContextForUser)(e);if(!t)throw new u({status:403,code:"CONTEXT_FORBIDDEN",message:"No agency membership for requested context"});return t},d=async e=>{let t=await (0,n.resolveSubAccountContextForUser)(e);if(!t)throw new u({status:403,code:"CONTEXT_FORBIDDEN",message:"No subaccount membership for requested context"});return t};if("apiKey"===e.principal.kind){let t=e.principal;if("AGENCY"===t.apiKeyKind){if(!t.agencyId)throw new u({status:500,code:"CONTEXT_INVALID",message:"Agency api key missing agencyId"});if(i&&i!==t.agencyId)throw new u({status:403,code:"CONTEXT_FORBIDDEN",message:"Agency header does not match api key scope"});if(a){if(!await l({subAccountId:a,agencyId:t.agencyId}))throw new u({status:404,code:"CONTEXT_INVALID",message:"Subaccount does not belong to agency"});if(t.allowedSubAccountIds?.length&&!t.allowedSubAccountIds.includes(a))throw new u({status:403,code:"CONTEXT_FORBIDDEN",message:"Api key not allowed to access this subaccount"});return{kind:"subaccount",agencyId:t.agencyId,subAccountId:a}}return{kind:"agency",agencyId:t.agencyId}}if("SUBACCOUNT"===t.apiKeyKind){if(!t.subAccountId)throw new u({status:500,code:"CONTEXT_INVALID",message:"Subaccount api key missing subAccountId"});if(a&&a!==t.subAccountId)throw new u({status:403,code:"CONTEXT_FORBIDDEN",message:"Subaccount header does not match api key scope"});let e=t.agencyId||(await s.db.subAccount.findUnique({where:{id:t.subAccountId},select:{agencyId:!0}}))?.agencyId;if(!e)throw new u({status:404,code:"CONTEXT_INVALID",message:"Subaccount not found for api key"});return{kind:"subaccount",agencyId:e,subAccountId:t.subAccountId}}if(!i&&!a)throw new u({status:400,code:"CONTEXT_MISSING",message:"Missing x-autlify-agency or x-autlify-subaccount header"});if(a){let e=await d({userId:t.ownerUserId,subAccountId:a});if(i&&i!==e.agencyId)throw new u({status:403,code:"CONTEXT_FORBIDDEN",message:"Agency header does not match subaccount agency"});return{kind:"subaccount",agencyId:e.agencyId,subAccountId:a}}return await c({userId:t.ownerUserId,agencyId:i}),{kind:"agency",agencyId:i}}if(!i&&!a)throw new u({status:400,code:"CONTEXT_MISSING",message:"Missing x-autlify-agency or x-autlify-subaccount header"});if(a){let t=await d({userId:e.principal.userId,subAccountId:a});if(i&&i!==t.agencyId)throw new u({status:403,code:"CONTEXT_FORBIDDEN",message:"Agency header does not match subaccount agency"});return{kind:"subaccount",agencyId:t.agencyId,subAccountId:a}}return await c({userId:e.principal.userId,agencyId:i}),{kind:"agency",agencyId:i}};class y extends Error{status;code;constructor(e){super(e.message),this.name="ApiAuthzError",this.status=e.status,this.code=e.code}}class A extends Error{constructor(e){super(e),this.name="AuthzError"}}let g=e=>e.trim(),p=async e=>{let n=e.failMode??"redirect",r=e.redirectTo??"/",i=e.permissionKeys.map(g),s=e.requiredKeys.map(g).filter(Boolean);s.every(e=>i.includes(e))||((e,n,r)=>{if("notFound"===e&&(0,t.notFound)(),"throw"===e)throw new A(r);(0,t.redirect)(n)})(n,r,`Missing permissions: ${s.join(", ")}`)},E=async e=>{let t,r=await d(e.req);if(!r)throw new y({status:401,code:"UNAUTHENTICATED",message:"Unauthenticated"});try{t=await I({principal:r,headers:e.req.headers})}catch(i){if(i instanceof u&&"CONTEXT_MISSING"===i.code&&"user"===r.kind){let i=new URL(e.req.url),s=i.searchParams.get("agencyId")||void 0,a=i.searchParams.get("subAccountId")||void 0;if(a){let e=await (0,n.resolveSubAccountContextForUser)({userId:r.userId,subAccountId:a});if(!e)throw new y({status:403,code:"FORBIDDEN",message:"No subaccount membership for requested context"});t={kind:"subaccount",agencyId:e.agencyId,subAccountId:a}}else if(s){if(!await (0,n.resolveAgencyContextForUser)({userId:r.userId,agencyId:s}))throw new y({status:403,code:"FORBIDDEN",message:"No agency membership for requested context"});t={kind:"agency",agencyId:s}}else throw new y({status:400,code:"INVALID_REQUEST",message:"Missing scope: provide x-autlify-agency-id / x-autlify-subaccount-id headers (SDK) or agencyId/subAccountId query (UI)"})}else if(i instanceof u)throw new y({status:i.status,code:400===i.status?"INVALID_REQUEST":"FORBIDDEN",message:i.message});throw i}if("user"===r.kind){let i="agency"===t.kind?await (0,n.resolveAgencyContextForUser)({userId:r.userId,agencyId:t.agencyId}):await (0,n.resolveSubAccountContextForUser)({userId:r.userId,subAccountId:t.subAccountId});if(!i)throw new y({status:403,code:"FORBIDDEN",message:"No membership"});if(await p({permissionKeys:i.permissionKeys,requiredKeys:e.requiredKeys,failMode:"throw",redirectTo:"/"}),(e.requireActiveSubscription??!0)&&"agency"===t.kind&&"ACTIVE"!==await (0,n.getAgencySubscriptionState)(i.agencyId)||(e.requireActiveSubscription??!0)&&"subaccount"===t.kind&&"ACTIVE"!==await (0,n.getAgencySubscriptionState)(t.agencyId))throw new y({status:402,code:"FORBIDDEN",message:"Inactive subscription"});return{scope:t,principal:{kind:"user",userId:r.userId,permissionKeys:i.permissionKeys}}}if("USER"===r.apiKeyKind){let i="agency"===t.kind?await (0,n.resolveAgencyContextForUser)({userId:r.ownerUserId,agencyId:t.agencyId}):await (0,n.resolveSubAccountContextForUser)({userId:r.ownerUserId,subAccountId:t.subAccountId});if(!i)throw new y({status:403,code:"FORBIDDEN",message:"No membership"});await p({permissionKeys:r.permissionKeys,requiredKeys:e.requiredKeys,failMode:"throw",redirectTo:"/"}),await p({permissionKeys:i.permissionKeys,requiredKeys:e.requiredKeys,failMode:"throw",redirectTo:"/"})}else await p({permissionKeys:r.permissionKeys,requiredKeys:e.requiredKeys,failMode:"throw",redirectTo:"/"});if((e.requireActiveSubscription??!0)&&"agency"===t.kind&&"ACTIVE"!==await (0,n.getAgencySubscriptionState)(t.agencyId)||(e.requireActiveSubscription??!0)&&"subaccount"===t.kind&&"ACTIVE"!==await (0,n.getAgencySubscriptionState)(t.agencyId))throw new y({status:402,code:"FORBIDDEN",message:"Inactive subscription"});return{scope:t,principal:{kind:"apiKey",apiKeyId:r.apiKeyId,apiKeyKind:r.apiKeyKind,ownerUserId:r.ownerUserId,permissionKeys:r.permissionKeys}}};e.s(["ApiAuthzError",()=>y,"requirePermission",0,p,"requireRequestAccess",0,E],661418)},974389,e=>{"use strict";var t=e.i(67982);e.s(["Prisma",0,t])},192345,249866,e=>{"use strict";var t=e.i(254799);function n(e=32){return t.default.randomBytes(e).toString("hex")}function r(e){return t.default.createHash("sha256").update(e).digest("hex")}function i(e,n){return t.default.createHmac("sha256",e).update(n).digest("hex")}function s(e,n){let r=Buffer.from(e,"hex"),i=Buffer.from(n,"hex");return r.length===i.length&&t.default.timingSafeEqual(r,i)}function a(){let e=process.env.AUTLIFY_ENCRYPTION_KEY;if(!e)return null;if(/^[0-9a-fA-F]{64}$/.test(e))return Buffer.from(e,"hex");try{let t=Buffer.from(e,"base64");if(32===t.length)return t}catch{}return null}function c(e){let n=a();if(!n)return null;let r=t.default.randomBytes(12),i=t.default.createCipheriv("aes-256-gcm",n,r),s=Buffer.concat([i.update(e,"utf8"),i.final()]),c=i.getAuthTag(),o=e=>e.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");return`v1.${o(r)}.${o(s)}.${o(c)}`}function o(e){let n=a();if(!n)return null;let r=String(e).split(".");if(4!==r.length||"v1"!==r[0])return null;let i=e=>{let t="=".repeat((4-e.length%4)%4),n=e.replace(/-/g,"+").replace(/_/g,"/")+t;return Buffer.from(n,"base64")},s=i(r[1]),c=i(r[2]),o=i(r[3]);try{let e=t.default.createDecipheriv("aes-256-gcm",n,s);return e.setAuthTag(o),Buffer.concat([e.update(c),e.final()]).toString("utf8")}catch{return null}}function d(){let e=`ak_${n(4)}`,t=n(32);return{apiKey:`${e}.${t}`,keyPrefix:e,keyHash:r(t)}}function u(e){let[t,n]=e.apiKey.split(".",2);return!!t&&!!n&&t===e.storedPrefix&&s(r(n),e.storedHash)}e.s(["decryptStringGcm",()=>o,"encryptStringGcm",()=>c,"hmacSha256Hex",()=>i,"randomToken",()=>n,"sha256Hex",()=>r,"timingSafeEqualHex",()=>s],249866),e.s(["generateIntegrationApiKey",()=>d,"verifyIntegrationApiKey",()=>u],192345)}];

//# sourceMappingURL=src_7de46404._.js.map