import assert from "node:assert/strict";

const originalFetch = globalThis.fetch;
const port = 4192;

process.env.PORT = String(port);
process.env.HOST = "127.0.0.1";
process.env.FARMLAND_SYNC_ENABLED = "false";
process.env.VACANT_HOUSE_SYNC_ENABLED = "false";
process.env.DATA_GO_KR_SERVICE_KEY = "test-key";
process.env.KAKAO_REST_API_KEY = "";

globalThis.fetch = async (input, options) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return originalFetch(input, options);
  if (url.pathname.includes("/OnbidRlstListSrvc2/getRlstCltrList2")) {
    const privateContract = url.searchParams.get("pvctTrgtYn");
    return Response.json({
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE" },
        body: {
          items: {
            item: privateContract === "N" ? [{
              cltrMngNo: "2026-TEST-0001",
              onbidCltrno: "123",
              onbidPbancNo: "456",
              pbctCdtnNo: "789",
              pbctNo: "1011",
              cltrPrptDivCd: "0005",
              onbidCltrNm: "충청북도 괴산군 청천면 123 전",
              radr: "충청북도 괴산군 청천면 테스트길 10",
              cltrUsgSclsCtgrNm: "전",
              dspsMthodCd: "0001",
              lowstBidPrc: 50_000_000,
              landSqms: 1_200,
              pbctDdlnDt: "2026-08-20 17:00",
              lat: 36.6601,
              lng: 127.7371
            }] : []
          }
        }
      }
    });
  }
  if (url.hostname === "api.odcloud.kr") {
    return Response.json({
      currentCount: 1,
      data: [{
        시도명: "충청북도",
        시군구명: "충주시",
        읍면동명: "주덕읍",
        도로명주소: "충청북도 충주시 주덕읍 테스트길 20",
        위도: "36.9701",
        경도: "127.7952",
        주택유형: "단독",
        구조유형: "벽돌조",
        건축연도: "1988",
        빈집등급: "2등급",
        "데이터 기준일": "2025-06-30"
      }],
      totalCount: 1
    });
  }
  throw new Error(`Unexpected external request: ${url}`);
};

await import("./server.mjs");

let payload;
for (let attempt = 0; attempt < 30; attempt += 1) {
  try {
    const response = await originalFetch(`http://127.0.0.1:${port}/api/live-listings?legalCode=43&regionName=${encodeURIComponent("충청북도")}`);
    if (response.ok) {
      payload = await response.json();
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 50));
}

assert.ok(payload, "local API did not start");
assert.equal(payload.sources.onbid.status, "connected");
assert.equal(payload.sources.onbid.count, 1);
assert.equal(payload.sources.municipal.status, "connected");
assert.equal(payload.sources.municipal.count, 1);

const onbid = payload.listings.find((listing) => listing.source === "onbid");
assert.equal(onbid.managedBy, "onbid-live");
assert.equal(onbid.propertyType, "farmland");
assert.equal(onbid.price, 5_000);
assert.equal(onbid.area, 1_200);
assert.match(onbid.url, /onbid\.co\.kr/);

const municipal = payload.listings.find((listing) => listing.source === "municipal");
assert.equal(municipal.managedBy, "municipal-vacant-live");
assert.equal(municipal.dealType, "candidate");
assert.equal(municipal.lat, 36.9701);
assert.match(municipal.memo, /매매·임대 의사가 확인된 매물이 아닙니다/);

console.log("public connector integration test passed");
process.exit(0);
