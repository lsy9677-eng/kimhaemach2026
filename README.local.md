# 로컬 개발 환경

로컬에서는 가상 프로젝트의 Firebase Firestore·Storage Emulator를 사용합니다.
운영 Firebase 계정 로그인, 데이터 복제, 배포는 필요하지 않습니다.
기존 자동 쓰기와 로그인 방식은 그대로이며, 대상만 개발 DB로 분리합니다.

## 준비 (Windows PowerShell)

Node.js 24와 Chrome이 필요합니다. CLI와 테스트 도구는 프로젝트에 고정 버전으로 설치합니다.

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install-jdk.ps1
```

JDK 21이 이미 PATH에 있으면 JDK 설치를 생략할 수 있습니다.
설치 스크립트는 Temurin JDK를 다운로드하고 SHA256을 확인해 `.local/java`에 풉니다.
시스템 Java 설정을 바꾸지 않습니다. 최초 Emulator 시작에는 바이너리 다운로드가 필요합니다.
`.local`, `node_modules`, 로그와 검증 결과는 Git에서 제외합니다.

## 실행

```powershell
npm.cmd run dev
```

두 Emulator의 준비 메시지가 나온 후 **별도 터미널**에서 다음을 실행합니다.

```powershell
npm.cmd run seed
```

가상 데이터를 다시 넣는 명령이므로 테스트 중 변경한 가상 설정은 덮어씁니다.
관리자 테스트 비밀번호는 `demo-admin-2026`입니다. 가상테스트클럽의 경기이사·클럽회원 비밀번호는 `demo-club-2026`입니다.
가상 선수·클럽·미래 대회만 생성하며 운영 데이터는 가져오지 않습니다.
Emulator 데이터는 메모리에 있으며 종료 후 다시 seed해야 합니다.

| 항목 | 김해 | 장유 |
|---|---|---|
| 앱 | http://127.0.0.1:5500/ | http://127.0.0.1:5500/?org=jangyu |
| 프로젝트 | demo-kimhae-dev | demo-jangyu-dev |
| Firestore | 127.0.0.1:8080 | 127.0.0.1:8081 |
| Storage | 127.0.0.1:9199 | 127.0.0.1:9299 |
| Emulator UI | http://127.0.0.1:4000/ | http://127.0.0.1:4001/ |

장유의 공통 `identityDb`는 김해 개발 Firestore(8080)를 참조합니다.
`Ctrl+C`로 종료합니다. 개발 실행기는 종료 시 자신이 생성한 Emulator 프로세스도 종료합니다.

## 분리 정책

- localhost, 루프백·IPv4 주소, `.localhost`·`.local`·`.test`, 단일 호스트명 및 파일 미리보기는 개발 설정입니다. `?env=production`으로 우회할 수 없습니다. 파일 직접 열기는 ES 모듈 제약으로 지원하지 않습니다.
- 운영은 `assets/js/production-hosts.js`에 명시된 정확한 HTTPS 호스트만 허용합니다. 하위 도메인이나 HTTP는 자동 허용하지 않습니다. 확인되지 않은 공개 주소는 Firebase 초기화 전에 오류로 중단합니다.
- **운영 호스트:** 사용자가 2026-10-26에 실제 사용 주소로 확인한 `https://kimhaemach2026.pages.dev/`만 등록했습니다. 김해·장유는 같은 앱에서 `org`로 전환하며 장유용 별도 호스트는 없습니다. HTTP, 미리보기·브랜치 하위 도메인, 유사 호스트는 허용하지 않습니다. 기존 Firebase 설정과 운영 세션 키를 유지합니다. 확인 과정에서 운영 사이트에 접속하지 않았습니다.
- 개발에서는 `db`, `identityDb`, `storage` 모두 첫 작업 전에 로컬 Emulator에 연결합니다. 실패해도 운영으로 전환하지 않습니다.
- 개발 브라우저 저장소는 `OAI_DEV:` 접두사를 사용합니다. 개발 내 단체 간 공통 로그인은 유지하며 운영 세션을 복원하지 않습니다.
- 개발 캐시 정리는 `OAI_DEV:` 캐시만 대상으로 합니다. 운영 캐시 정리는 개발 캐시를 제외합니다. 현재 앱은 서비스 워커를 새로 등록하지 않습니다.
- 개발 서버는 CSP로 Firestore·Storage 연결을 지정된 로컬 포트에 제한합니다. SDK·보조 라이브러리 CDN 로딩에는 인터넷이 필요합니다.
- 개발 CLI는 별도 설정·Emulator 캐시 디렉터리를 사용하며 사용자 Firebase 로그인 설정을 재사용하지 않습니다.
- 두 Emulator의 `TEMP`, `TMP`, `TMPDIR`를 `.local/tmp/kimhae`, `.local/tmp/jangyu`로 각각 설정합니다. IPC로 CLI의 정상 종료 처리를 호출해 Storage 정리가 상대 디렉터리에 영향을 주지 않게 합니다.
- 오더 사진의 data URL은 네트워크 fetch 없이 메모리에서 Blob으로 변환합니다. CSP의 운영 Firebase 차단 정책은 그대로입니다. 한글 부서명은 개발 Storage에서 SDK가 인코딩하도록 하고, 기존 운영 객체 경로는 유지합니다.
- `dev/*.rules`는 가상 데이터용 허용 규칙입니다. 운영에 배포하지 마세요. 기본 배포 설정 파일은 추가하지 않았으며, 개발 실행기에서만 `--config`로 선택합니다.

## 검증

```powershell
npm.cmd test
# Emulator 실행 중: 가상 데이터 재생성 후 실제 Chrome으로 저장·업로드 검증
npm.cmd run test:emulator
# Emulator 실행 중: 업로드를 강제로 실패시켜 통합 테스트가 실제로 실패하는지 확인
npm.cmd run test:upload-failure
# dev를 Ctrl+C로 종료한 뒤: 실제 Emulator 포트가 닫혔는지 확인 후 검증
npm.cmd run test:offline
# 개발 서버/Emulator 종료 상태: 자체적으로 두 Emulator를 시작하고 양방향 종료 격리 검사
npm.cmd run test:storage-isolation
```

테스트는 운영 Firebase 요청을 전송 전에 차단하고, 시도 자체가 있으면 실패합니다.
온라인 테스트는 실제 앱 로그인, 공지 저장, 팝업·실제 경기 오더 사진 업로드·다운로드,
공통 로그인 설정 저장 대상, 세션·Cache Storage 분리를 확인합니다. 관리자 세션 복원,
경기이사·클럽회원 로그인, 새로고침 후 복원과 김해↔장유 전환도 검증합니다.
매번 UUID를 넣은 고유 이미지 내용을 생성하고, 이번 업로드 응답의 정확한 객체명과
다운로드 바이트를 비교합니다. 이전 파일 목록으로 성공을 판단하지 않습니다.
오프라인 테스트는 시작·명시적 쓰기·업로드의 대상이 계속 로컬인지 확인합니다.
결과는 `test-results/online.json`, `offline.json`, `storage-isolation.json`, `upload-failure.json`에 기록합니다.
운영 유지 여부는 네트워크 없이 설정·키를 검사하며 운영 사이트에 접속하지 않습니다.

기존 팝업 공지 업로드 코드에서 `saveMeta()`가 `popupNotice` 메타데이터를 저장 payload에
포함하지 않는 현상을 확인했습니다. 이번 환경 분리 범위에서는 수정하지 않았으며,
업로드 검증은 Storage에 저장된 실제 파일을 다운로드해 원본 바이트와 비교합니다.
