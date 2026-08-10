# Mobile Wedding

Node.js만으로 실행되는 모바일 청첩장 프로토타입입니다.

```powershell
node server.mjs
```

브라우저에서 `http://localhost:5173`을 연 뒤 **저장하고 공유하기**를 누르면 청첩장이 서버의 `data/invitations.json`에 저장되고, 공유 가능한 `?invite=...` URL이 클립보드에 복사됩니다.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/invitations` | 새 청첩장 생성 |
| `GET` | `/api/invitations/:id` | 공유용 청첩장 조회 |
| `PUT` | `/api/invitations/:id` | 청첩장 생성 또는 수정 |

현재는 로컬 프로토타입용 파일 저장소입니다. 실제 서비스 전환 시에는 인증, 권한 검사, 데이터베이스, 이미지 오브젝트 스토리지 및 계좌 정보 암호화를 추가해야 합니다.
