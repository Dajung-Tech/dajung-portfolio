# 토지잇기

가족이 농지·농촌주택 매물을 한 화면에서 비교하고, 직접 매물·메모·즐겨찾기를 함께 관리하는 지도입니다.

## 주요 기능

- 농지은행 공식 GIS 및 그린대로 농촌빈집은행 공개 목록 조회
- 직접 등록 매물 가족 공용 저장
- 모든 매물에 가족 공용 메모와 즐겨찾기 저장
- 즐겨찾기만 모아보기
- 30초 간격 공용 데이터 갱신
- 선택 지역을 네이버 부동산 주택 매매·한방·땅야 공식 결과 화면으로 연결
- 로그인 화면 대신 비밀 가족 링크 사용

농촌빈집은행은 공식 목록이 좌표를 제공하지 않고 주소 숫자를 가려서 표시합니다. 토지잇기도 같은 공개 범위를 지켜 목록에는 표시하지만 임의 지도 마커는 만들지 않습니다.

## 로컬 실행

`start.cmd`를 더블 클릭하거나 PowerShell에서 실행합니다.

```powershell
npm start
```

브라우저에서 `http://localhost:4173`을 엽니다. 공용 DB 환경변수가 없으면 직접 매물·메모·즐겨찾기는 현재 브라우저에만 저장됩니다.

## Supabase 공용 데이터베이스 준비

1. Supabase에서 무료 프로젝트를 생성합니다.
2. `SQL Editor`를 열고 [`supabase-schema.sql`](./supabase-schema.sql)의 전체 내용을 실행합니다.
3. 프로젝트의 `Connect` 또는 `Settings > API Keys`에서 다음 값을 확인합니다.
   - Project URL
   - 서버용 Secret key (`sb_secret_...` 권장)
4. Secret key는 브라우저 코드, GitHub, 가족 공유 링크에 절대 넣지 않습니다.

로컬 연결 테스트는 새 PowerShell 창에서 실행합니다.

```powershell
$env:SUPABASE_URL="https://프로젝트-ID.supabase.co"
$env:SUPABASE_SECRET_KEY="sb_secret_서버용-비밀키"
$env:FAMILY_ACCESS_KEY="충분히-길고-추측하기-어려운-가족키"
npm start
```

안전한 가족키는 다음 명령으로 만들 수 있습니다.

```powershell
node -e "import('node:crypto').then(({randomBytes})=>console.log(randomBytes(24).toString('base64url')))"
```

가족키를 설정한 로컬 서버는 `http://localhost:4173/?access=가족키`로 처음 접속합니다. 서버가 HttpOnly 쿠키를 저장하고 주소창에서 키를 제거하므로 이후에는 로그인 없이 사용할 수 있습니다.

## Render 무료 배포

프로젝트에는 [`render.yaml`](./render.yaml)이 포함되어 있습니다.

1. 이 폴더를 GitHub 비공개 저장소에 올립니다.
2. Render에서 `New > Blueprint`를 선택하고 저장소를 연결합니다.
3. 배포 과정에서 다음 Secret 환경변수를 입력합니다.
   - `SUPABASE_URL`: Supabase Project URL
   - `SUPABASE_SECRET_KEY`: Supabase 서버용 Secret key
   - `FAMILY_ACCESS_KEY`: 위에서 생성한 가족키
4. 배포 완료 후 `https://서비스이름.onrender.com/?access=가족키`를 가족에게 한 번 전달합니다.
5. 가족 브라우저에 쿠키가 저장된 뒤에는 `?access=...` 없는 일반 주소로 접속할 수 있습니다.

Render 헬스 체크는 인증 없이 `/health`만 사용하며, 다른 화면과 API는 가족키 쿠키로 보호됩니다. Render 무료 웹 서비스는 장시간 사용하지 않으면 휴면 상태가 되어 첫 접속이 늦을 수 있습니다. Supabase 무료 프로젝트도 장기간 활동이 없으면 일시 정지될 수 있습니다.

## 농촌빈집 PC 동기화

그린대로가 Render의 해외 서버 요청을 웹 방화벽으로 차단할 수 있어, 농촌빈집은 한국의 개인 PC에서 조회한 뒤 Supabase 캐시에 저장할 수 있습니다. Supabase Secret key는 PC에 저장하지 않고 배포 주소와 가족키만 사용합니다.

1. 권장: Supabase `SQL Editor`에서 최신 [`supabase-schema.sql`](./supabase-schema.sql)을 다시 실행해 전용 `family_external_caches` 테이블을 만듭니다. 생략하면 기존 가족 공용 매물 테이블을 호환 저장소로 자동 사용합니다.
2. [`.env.vacant.local.example`](./.env.vacant.local.example)을 `.env.vacant.local`로 복사합니다.
3. `.env.vacant.local`에 실제 값을 입력합니다.

```dotenv
LANDLINK_URL=https://서비스이름.onrender.com
FAMILY_ACCESS_KEY=Render에 설정한 가족키
KAKAO_REST_API_KEY=Kakao-Developers의-REST-API-키
```

4. [`sync-vacant.cmd`](./sync-vacant.cmd)를 더블 클릭합니다.
5. 완료 메시지가 나오면 웹사이트에서 `공공 매물 새로고침`을 누릅니다.

`.env.vacant.local`은 Git에서 제외되며 공유하면 안 됩니다. 빈집은 수시로 변하지 않으므로 하루 한 번 또는 필요할 때 실행하면 됩니다. Windows 작업 스케줄러에서는 프로그램을 `sync-vacant.cmd`, 시작 위치를 이 폴더로 지정해 자동 실행할 수 있습니다.

동기화 도구는 농촌빈집은행 목록 응답에 공개된 도로명주소를 사용합니다. 원본에 좌표가 없으므로 `KAKAO_REST_API_KEY`가 있으면 그린대로 상세 화면과 동일하게 Kakao 주소검색으로 좌표화합니다. 변환 결과는 `.vacant-geocode-cache.json`에 저장해 같은 주소를 반복 조회하지 않습니다. 키 없이 `--allow-approximate`를 지정한 경우에만 OpenStreetMap Nominatim 근사 좌표를 사용하며, 실제 건물 위치와 차이가 날 수 있습니다. 이때는 [공개 Nominatim 사용 정책](https://operations.osmfoundation.org/policies/nominatim/)에 맞춰 한 번에 하나씩, 초당 1회 미만으로 조회합니다.

좌표 변환만 점검하고 서버에 업로드하지 않으려면 `node sync-vacant.mjs --geocode-only`를 실행합니다.

### 실제 농촌빈집 마커를 로컬에서 확인

그린대로 상세 화면은 원본 좌표를 내려주지 않고 공개 도로명주소를 Kakao 주소검색으로 좌표화합니다. 같은 상세 좌표를 만들려면 [Kakao 주소 검색 REST API](https://developers.kakao.com/docs/ko/kakaomap/rest-api)의 REST API 키를 `.env.vacant.local`에 `KAKAO_REST_API_KEY=...`로 넣습니다. 이 키는 브라우저에 노출되지 않고 PC 동기화 도구에서만 사용됩니다.

첫 번째 PowerShell:

```powershell
cd D:\Project\dajung-portfolio\land-link-map
npm start
```

두 번째 PowerShell:

```powershell
cd D:\Project\dajung-portfolio\land-link-map
node sync-vacant.mjs --local
```

동기화가 끝나면 `http://localhost:4173`을 새로고침하고 조회 지역을 선택합니다. 서버는 `.vacant-listings.local.json`에서 실제 그린대로 빈집과 Kakao 좌표를 읽어 주황색 `주` 마커로 표시합니다. Supabase 설정은 필요하지 않습니다. 키 없이 근사 좌표 동작만 확인하려면 `node sync-vacant.mjs --local --allow-approximate`를 사용할 수 있습니다.

## 데이터 공유 범위

| 데이터 | 저장 위치 | 가족 공유 |
| --- | --- | --- |
| 직접 등록 매물 | Supabase | 공유됨 |
| 가족 메모 | Supabase | 공유됨 |
| 즐겨찾기 | Supabase | 공유됨 |
| 지도 종류·조회 지역 | 각 브라우저 | 공유되지 않음 |
| 농지은행 조회 캐시 | Render 서버 메모리 | 서버 재시작 시 다시 조회 |
| 농촌빈집 조회 캐시 | Supabase | PC 동기화 후 공유됨 |

공용 DB를 처음 연결한 브라우저는 기존 로컬 직접 매물·메모·즐겨찾기를 한 번 자동으로 공용 DB에 옮깁니다.

## 사용법

1. 왼쪽에서 시·도, 시·군·구, 읍·면·동을 선택합니다.
2. `공공 매물 새로고침`을 누릅니다.
3. 목록의 별 버튼으로 가족 즐겨찾기를 지정합니다.
4. 매물 상세 화면에서 가족 공용 메모를 저장합니다.
5. `즐겨찾기만 보기`로 관심 매물을 모아봅니다.

## 선택 지역을 민간 서비스에서 보기

지도 오른쪽 위의 외부 링크 아이콘은 왼쪽 지역 선택기의 법정동 코드와 지역명을 사용합니다.

- 한방: 공식 검색 폼에 시·도/시·군·구/읍·면·동 코드를 제출합니다.
- 땅야: 법정동 코드를 포함한 공식 지역 매물 목록을 엽니다.
- 네이버 부동산: 조회 지역의 농지 좌표 범위 또는 시·도 중심으로 이동하고 주택 매매 필터를 적용합니다.
- 디스코·밸류맵: 공식 지역 딥링크가 없어 자동 적용 버튼이 비활성화됩니다.

민간 서비스의 매물 데이터를 수집하지 않고 공식 지역 링크만 엽니다.

## 기타 환경 변수

```powershell
$env:FARMLAND_LEGAL_CODE="43"
$env:FARMLAND_REGION_NAME="충청북도"
$env:LIVE_SYNC_MINUTES="30"
$env:FARMLAND_SYNC_ENABLED="true"
$env:VACANT_HOUSE_SYNC_ENABLED="true"
```

## CSV

`data/sample-properties.csv`를 참고하세요.

- `source`: `farmland`, `vacant`, `personal`
- `propertyType`: `land`, `house`, `farmland`
- `dealType`: `sale`, `lease`
- `price`: 만원 단위
- `area`: 제곱미터(㎡) 단위

## 주의

- 가족 공유 링크를 가진 사람은 공용 매물·메모·즐겨찾기를 수정할 수 있습니다.
- 가족키가 유출되면 Render의 `FAMILY_ACCESS_KEY` 값을 변경하세요.
- Supabase Secret key는 반드시 Render 환경변수에만 저장하세요.
- 공공 사이트 연결은 저빈도 가족 조회를 전제로 하며 제공처 응답 형식 변경 시 수정이 필요할 수 있습니다.
