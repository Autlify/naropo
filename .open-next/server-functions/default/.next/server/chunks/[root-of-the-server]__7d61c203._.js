module.exports=[974389,e=>{"use strict";var t=e.i(67982);e.s(["Prisma",0,t])},192345,249866,e=>{"use strict";var t=e.i(254799);function n(e=32){return t.default.randomBytes(e).toString("hex")}function r(e){return t.default.createHash("sha256").update(e).digest("hex")}function a(e,n){return t.default.createHmac("sha256",e).update(n).digest("hex")}function i(e,n){let r=Buffer.from(e,"hex"),a=Buffer.from(n,"hex");return r.length===a.length&&t.default.timingSafeEqual(r,a)}function s(){let e=process.env.AUTLIFY_ENCRYPTION_KEY;if(!e)return null;if(/^[0-9a-fA-F]{64}$/.test(e))return Buffer.from(e,"hex");try{let t=Buffer.from(e,"base64");if(32===t.length)return t}catch{}return null}function o(e){let n=s();if(!n)return null;let r=t.default.randomBytes(12),a=t.default.createCipheriv("aes-256-gcm",n,r),i=Buffer.concat([a.update(e,"utf8"),a.final()]),o=a.getAuthTag(),c=e=>e.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");return`v1.${c(r)}.${c(i)}.${c(o)}`}function c(e){let n=s();if(!n)return null;let r=String(e).split(".");if(4!==r.length||"v1"!==r[0])return null;let a=e=>{let t="=".repeat((4-e.length%4)%4),n=e.replace(/-/g,"+").replace(/_/g,"/")+t;return Buffer.from(n,"base64")},i=a(r[1]),o=a(r[2]),c=a(r[3]);try{let e=t.default.createDecipheriv("aes-256-gcm",n,i);return e.setAuthTag(c),Buffer.concat([e.update(o),e.final()]).toString("utf8")}catch{return null}}function d(){let e=`ak_${n(4)}`,t=n(32);return{apiKey:`${e}.${t}`,keyPrefix:e,keyHash:r(t)}}function u(e){let[t,n]=e.apiKey.split(".",2);return!!t&&!!n&&t===e.storedPrefix&&i(r(n),e.storedHash)}e.s(["decryptStringGcm",()=>c,"encryptStringGcm",()=>o,"hmacSha256Hex",()=>a,"randomToken",()=>n,"sha256Hex",()=>r,"timingSafeEqualHex",()=>i],249866),e.s(["generateIntegrationApiKey",()=>d,"verifyIntegrationApiKey",()=>u],192345)},569914,e=>{"use strict";e.i(423502);var t=e.i(843793);e.i(828189);var n=e.i(974389),r=e.i(192345);async function a(e){return"AGENCY"===e.type?await t.db.$queryRaw(n.Prisma.sql`SELECT "id","name","keyPrefix","createdAt","revokedAt","lastUsedAt"
                FROM "IntegrationApiKey"
                WHERE "agencyId" = ${e.agencyId} AND "subAccountId" IS NULL
                ORDER BY "createdAt" DESC`):await t.db.$queryRaw(n.Prisma.sql`SELECT "id","name","keyPrefix","createdAt","revokedAt","lastUsedAt"
              FROM "IntegrationApiKey"
              WHERE "subAccountId" = ${e.subAccountId}
              ORDER BY "createdAt" DESC`)}async function i(e){let{apiKey:a,keyPrefix:i,keyHash:s}=(0,r.generateIntegrationApiKey)(),o=h(),c="AGENCY"===e.scope.type?e.scope.agencyId:null,d="SUBACCOUNT"===e.scope.type?e.scope.subAccountId:null;return await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationApiKey"
      ("id","name","keyPrefix","keyHash","agencyId","subAccountId","createdByUserId","createdAt")
      VALUES
      (${o}, ${e.name}, ${i}, ${s}, ${c}, ${d}, ${e.createdByUserId??null}, now())`),{id:o,name:e.name,keyPrefix:i,apiKey:a}}async function s(e){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationApiKey" SET "revokedAt" = now() WHERE "id" = ${e}`)}async function o(e){return await t.db.$queryRaw(n.Prisma.sql`SELECT "id","connectionId","url","events","isActive","createdAt","updatedAt"
              FROM "IntegrationWebhookSubscription"
              WHERE "connectionId" = ${e}
              ORDER BY "createdAt" DESC`)}async function c(e){let r=h();return await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationWebhookSubscription"
      ("id","connectionId","url","secretHash","secretEnc","events","isActive","createdAt","updatedAt")
      VALUES
      (${r}, ${e.connectionId}, ${e.url}, ${e.secretHash??null}, ${e.secretEnc??null}, ${e.events}, true, now(), now())`),r}async function d(e,r){let a=r.url??null,i=r.events??null,s=r.isActive??null;await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationWebhookSubscription"
      SET
        "url" = COALESCE(${a}, "url"),
        "events" = COALESCE(${i}, "events"),
        "isActive" = COALESCE(${s}, "isActive"),
        "updatedAt" = now()
      WHERE "id" = ${e}`)}async function u(e){await t.db.$executeRaw(n.Prisma.sql`DELETE FROM "IntegrationWebhookSubscription" WHERE "id" = ${e}`)}async function l(e){let r="AGENCY"===e.scope.type?e.scope.agencyId:null,a="SUBACCOUNT"===e.scope.type?e.scope.subAccountId:null,i=await t.db.$queryRaw(n.Prisma.sql`SELECT "id"
              FROM "IntegrationConnection"
              WHERE "deletedAt" IS NULL
                AND "provider" = ${e.provider}
                AND "agencyId" IS NOT DISTINCT FROM ${r}
                AND "subAccountId" IS NOT DISTINCT FROM ${a}
              LIMIT 1`),s=i?.[0]?.id;if(s){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationConnection"
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
      (${o}, ${e.provider}, ${e.status??"DISCONNECTED"}, ${r}, ${a}, ${e.config??null}, ${e.credentials??null}, now(), now())`);let c=await t.db.$queryRaw(n.Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt"
              FROM "IntegrationConnection"
              WHERE "id" = ${o}
              LIMIT 1`);return c?.[0]??null}async function p(e,r){let a=r.status??null,i=r.config??null,s=r.credentials??null;await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationConnection"
      SET
        "status" = COALESCE(${a}, "status"),
        "config" = COALESCE(${i}, "config"),
        "credentials" = COALESCE(${s}, "credentials"),
        "updatedAt" = now()
      WHERE "id" = ${e} AND "deletedAt" IS NULL`)}async function I(e){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationConnection" SET "deletedAt" = now(), "updatedAt" = now() WHERE "id" = ${e}`)}async function E(e){let r=h();await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationProviderEvent"
      ("id","provider","connectionId","externalEventId","headers","payload","receivedAt")
      VALUES
      (${r}, ${e.provider}, ${e.connectionId}, ${e.externalEventId}, ${e.headers??null}, ${e.payload??null}, now())
      ON CONFLICT ("connectionId","externalEventId") DO NOTHING`);let a=await t.db.$queryRaw(n.Prisma.sql`SELECT "id","provider","connectionId","externalEventId","headers","payload","receivedAt","processedAt"
              FROM "IntegrationProviderEvent"
              WHERE "connectionId" = ${e.connectionId}
                AND "externalEventId" IS NOT DISTINCT FROM ${e.externalEventId}
              ORDER BY "receivedAt" DESC
              LIMIT 1`);return a?.[0]??null}async function A(e){let r=h();return await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationWebhookDelivery"
      ("id","subscriptionId","providerEventId","status","attemptCount","createdAt","updatedAt")
      VALUES
      (${r}, ${e.subscriptionId}, ${e.providerEventId??null}, 'PENDING', 0, now(), now())`),r}async function g(e){let r=h();return await t.db.$executeRaw(n.Prisma.sql`INSERT INTO "IntegrationWebhookDeliveryAttempt"
      ("id","deliveryId","statusCode","responseBody","error","durationMs","attemptedAt")
      VALUES
      (${r}, ${e.deliveryId}, ${e.statusCode??null}, ${e.responseBody??null}, ${e.error??null}, ${e.durationMs??null}, now())`),r}async function y(e,r){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationWebhookDelivery"
      SET "attemptCount" = "attemptCount" + 1,
          "status" = ${r},
          "updatedAt" = now()
      WHERE "id" = ${e}`)}async function f(e,r){let a=r?.limit??50;if("AGENCY"===e.type)return await t.db.$queryRaw(n.Prisma.sql`SELECT d."id", d."status", d."attemptCount", d."createdAt", s."url", c."provider", d."subscriptionId"
                FROM "IntegrationWebhookDelivery" d
                JOIN "IntegrationWebhookSubscription" s ON s."id" = d."subscriptionId"
                JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
                WHERE c."agencyId" = ${e.agencyId} AND c."subAccountId" IS NULL AND c."deletedAt" IS NULL
                ORDER BY d."createdAt" DESC
                LIMIT ${a}`);let i=await t.db.subAccount.findUnique({where:{id:e.subAccountId},select:{agencyId:!0}});return await t.db.$queryRaw(n.Prisma.sql`SELECT d."id", d."status", d."attemptCount", d."createdAt", s."url", c."provider", d."subscriptionId"
              FROM "IntegrationWebhookDelivery" d
              JOIN "IntegrationWebhookSubscription" s ON s."id" = d."subscriptionId"
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE c."deletedAt" IS NULL
                AND (
                  c."subAccountId" = ${e.subAccountId}
                  OR (c."agencyId" = ${i?.agencyId??null} AND c."subAccountId" IS NULL)
                )
              ORDER BY d."createdAt" DESC
              LIMIT ${a}`)}async function R(e,r){let a=n.Prisma.sql``;if(r?.type==="AGENCY")a=n.Prisma.sql` AND c."agencyId" = ${r.agencyId} AND c."subAccountId" IS NULL`;else if(r?.type==="SUBACCOUNT"){let e=await t.db.subAccount.findUnique({where:{id:r.subAccountId},select:{agencyId:!0}});a=n.Prisma.sql` AND (
      c."subAccountId" = ${r.subAccountId}
      OR (c."agencyId" = ${e?.agencyId??null} AND c."subAccountId" IS NULL)
    )`}let i=await t.db.$queryRaw(n.Prisma.sql`SELECT d.*, s."url" as "subscriptionUrl", c."provider" as "provider"
              FROM "IntegrationWebhookDelivery" d
              JOIN "IntegrationWebhookSubscription" s ON s."id" = d."subscriptionId"
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE d."id" = ${e}${a}
              LIMIT 1`),s=i?.[0]??null;return s?{delivery:s,attempts:await t.db.$queryRaw(n.Prisma.sql`SELECT "id","statusCode","responseBody","error","durationMs","attemptedAt"
              FROM "IntegrationWebhookDeliveryAttempt"
              WHERE "deliveryId" = ${e}
              ORDER BY "attemptedAt" DESC`)}:null}function h(){let t=globalThis;if(t?.crypto?.randomUUID)return t.crypto.randomUUID();try{let t=e.r(254799);if(t?.randomUUID)return t.randomUUID()}catch{}let n=[],r="0123456789abcdef";for(let e=0;e<36;e++)n[e]=r[Math.floor(16*Math.random())];return n[14]="4",n[19]=r[3&parseInt(n[19],16)|8],n[8]=n[13]=n[18]=n[23]="-",n.join("")}async function b(e){let r=await t.db.$queryRaw(n.Prisma.sql`SELECT s."id", s."connectionId", s."url", s."events", s."isActive", s."secretHash", s."secretEnc",
                     c."agencyId", c."subAccountId"
              FROM "IntegrationWebhookSubscription" s
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE s."id" = ${e}
              LIMIT 1`);return r?.[0]??null}async function v(e){await t.db.$executeRaw(n.Prisma.sql`UPDATE "IntegrationWebhookSubscription"
              SET "secretHash" = ${e.secretHash}, "secretEnc" = ${e.secretEnc}, "updatedAt" = now()
              WHERE "id" = ${e.subscriptionId}`)}async function m(e){let r=await t.db.$queryRaw(n.Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","credentials","config","createdAt","updatedAt","deletedAt"
              FROM "IntegrationConnection"
              WHERE "id" = ${e} AND "deletedAt" IS NULL
              LIMIT 1`);return r?.[0]??null}e.s(["createApiKey",()=>i,"createAttempt",()=>g,"createDelivery",()=>A,"createProviderEventIdempotent",()=>E,"createSubscription",()=>c,"deleteConnection",()=>I,"deleteSubscription",()=>u,"getConnectionById",()=>m,"getDeliveryDetail",()=>R,"getSubscriptionWithScope",()=>b,"incrementDeliveryAttempt",()=>y,"listApiKeys",()=>a,"listDeliveries",()=>f,"listSubscriptions",()=>o,"revokeApiKey",()=>s,"updateConnectionById",()=>p,"updateSubscription",()=>d,"updateSubscriptionSecret",()=>v,"upsertConnection",()=>l])},330874,e=>{"use strict";var t=e.i(747909),n=e.i(174017),r=e.i(996250),a=e.i(759756),i=e.i(561916),s=e.i(174677),o=e.i(869741),c=e.i(316795),d=e.i(487718),u=e.i(995169),l=e.i(47587),p=e.i(666012),I=e.i(570101),E=e.i(626937),A=e.i(10372),g=e.i(193695);e.i(52474);var y=e.i(600220),f=e.i(89171),R=e.i(661418),h=e.i(569914);async function b(e){try{var t,n,r;let a=await (0,R.requireRequestAccess)({req:e,requiredKeys:[]});if(t=a.principal.permissionKeys,n=a.scope.kind,"agency"===n?!t.includes("core.agency.account.read"):!t.includes("core.subaccount.account.read"))return f.NextResponse.json({error:"Forbidden"},{status:403});let i=await (0,h.listDeliveries)((r=a.scope,"agency"===r.kind?{type:"AGENCY",agencyId:r.agencyId}:{type:"SUBACCOUNT",subAccountId:r.subAccountId,agencyId:r.agencyId}),{limit:25}),s=i.length,o=i.filter(e=>"FAILED"===String(e.status)).length,c=i.filter(e=>"SUCCESS"===String(e.status)).length;return f.NextResponse.json({scope:a.scope,summary:{total:s,success:c,failed:o},latest:i.slice(0,10)})}catch(e){if(e instanceof Response)return e;return console.error(e),f.NextResponse.json({error:"Internal server error"},{status:500})}}e.s(["GET",()=>b],68886);var v=e.i(68886);let m=new t.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/features/core/support/diagnostics/webhooks/route",pathname:"/api/features/core/support/diagnostics/webhooks",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/features/core/support/diagnostics/webhooks/route.ts",nextConfigOutput:"standalone",userland:v}),{workAsyncStorage:C,workUnitAsyncStorage:$,serverHooks:S}=m;function w(){return(0,r.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:$})}async function N(e,t,r){m.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let f="/api/features/core/support/diagnostics/webhooks/route";f=f.replace(/\/index$/,"")||"/";let R=await m.prepare(e,t,{srcPage:f,multiZoneDraftMode:!1});if(!R)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:h,params:b,nextConfig:v,parsedUrl:C,isDraftMode:$,prerenderManifest:S,routerServerContext:w,isOnDemandRevalidate:N,revalidateOnlyGenerated:T,resolvedPathname:O,clientReferenceManifest:D,serverActionsManifest:P}=R,q=(0,o.normalizeAppPath)(f),x=!!(S.dynamicRoutes[q]||S.routes[O]),L=async()=>((null==w?void 0:w.render404)?await w.render404(e,t,C,!1):t.end("This page could not be found"),null);if(x&&!$){let e=!!S.routes[O],t=S.dynamicRoutes[q];if(t&&!1===t.fallback&&!e){if(v.experimental.adapterPath)return await L();throw new g.NoFallbackError}}let U=null;!x||m.isDev||$||(U="/index"===(U=O)?"/":U);let _=!0===m.isDev||!x,k=x&&!_;P&&D&&(0,s.setManifestsSingleton)({page:f,clientReferenceManifest:D,serverActionsManifest:P});let H=e.method||"GET",M=(0,i.getTracer)(),W=M.getActiveScopeSpan(),B={params:b,prerenderManifest:S,renderOpts:{experimental:{authInterrupts:!!v.experimental.authInterrupts},cacheComponents:!!v.cacheComponents,supportsDynamicResponse:_,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:v.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,r,a)=>m.onRequestError(e,t,r,a,w)},sharedContext:{buildId:h}},F=new c.NodeNextRequest(e),K=new c.NodeNextResponse(t),j=d.NextRequestAdapter.fromNodeNextRequest(F,(0,d.signalFromNodeResponse)(t));try{let s=async e=>m.handle(j,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=M.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=n.get("next.route");if(r){let t=`${H} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t)}else e.updateName(`${H} ${f}`)}),o=!!(0,a.getRequestMeta)(e,"minimalMode"),c=async a=>{var i,c;let d=async({previousCacheEntry:n})=>{try{if(!o&&N&&T&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await s(a);e.fetchMetrics=B.renderOpts.fetchMetrics;let c=B.renderOpts.pendingWaitUntil;c&&r.waitUntil&&(r.waitUntil(c),c=void 0);let d=B.renderOpts.collectedTags;if(!x)return await (0,p.sendResponse)(F,K,i,B.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,I.toNodeOutgoingHttpHeaders)(i.headers);d&&(t[A.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=A.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,r=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=A.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:y.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:r}}}}catch(t){throw(null==n?void 0:n.isStale)&&await m.onRequestError(e,t,{routerKind:"App Router",routePath:f,routeType:"route",revalidateReason:(0,l.getRevalidateReason)({isStaticGeneration:k,isOnDemandRevalidate:N})},!1,w),t}},u=await m.handleResponse({req:e,nextConfig:v,cacheKey:U,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:S,isRoutePPREnabled:!1,isOnDemandRevalidate:N,revalidateOnlyGenerated:T,responseGenerator:d,waitUntil:r.waitUntil,isMinimalMode:o});if(!x)return null;if((null==u||null==(i=u.value)?void 0:i.kind)!==y.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(c=u.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",N?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),$&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let g=(0,I.fromNodeOutgoingHttpHeaders)(u.value.headers);return o&&x||g.delete(A.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||g.get("Cache-Control")||g.set("Cache-Control",(0,E.getCacheControlHeader)(u.cacheControl)),await (0,p.sendResponse)(F,K,new Response(u.value.body,{headers:g,status:u.value.status||200})),null};W?await c(W):await M.withPropagatedContext(e.headers,()=>M.trace(u.BaseServerSpan.handleRequest,{spanName:`${H} ${f}`,kind:i.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},c))}catch(t){if(t instanceof g.NoFallbackError||await m.onRequestError(e,t,{routerKind:"App Router",routePath:q,routeType:"route",revalidateReason:(0,l.getRevalidateReason)({isStaticGeneration:k,isOnDemandRevalidate:N})},!1,w),x)throw t;return await (0,p.sendResponse)(F,K,new Response(null,{status:500})),null}}e.s(["handler",()=>N,"patchFetch",()=>w,"routeModule",()=>m,"serverHooks",()=>S,"workAsyncStorage",()=>C,"workUnitAsyncStorage",()=>$],330874)},916005,e=>{e.v(t=>Promise.all(["server/chunks/[externals]_node:buffer_00e2e67a._.js"].map(t=>e.l(t))).then(()=>t(951615)))},918707,e=>{e.v(t=>Promise.all(["server/chunks/2e4a4_@prisma_client_runtime_query_compiler_fast_bg_postgresql_mjs_35c4194d._.js"].map(t=>e.l(t))).then(()=>t(407142)))},480599,e=>{e.v(t=>Promise.all(["server/chunks/9c9c5_client_runtime_query_compiler_fast_bg_postgresql_wasm-base64_mjs_9e69af0b._.js"].map(t=>e.l(t))).then(()=>t(417734)))},642072,e=>{e.v(t=>Promise.all(["server/chunks/src_lib_62c344a8._.js","server/chunks/_b96aa026._.js","server/chunks/[root-of-the-server]__1b2c87c1._.js"].map(t=>e.l(t))).then(()=>t(485849)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__7d61c203._.js.map