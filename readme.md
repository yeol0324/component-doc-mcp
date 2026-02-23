# component-doc-mcp

React 컴포넌트를 분석하고 문서, JSDoc 주석, Storybook 파일을 자동 생성하는 MCP 서버

**사용 기술**: TypeScript, Node.js, Model Context Protocol (MCP)  
**핵심 역량**: 파일 시스템 처리, TypeScript Compiler API를 활용한 AST 파싱, CLI 도구 개발

---

## 🎯 프로젝트 개요

AI 어시스턴트가 다음 작업을 수행할 수 있게 합니다.

- React 컴포넌트 **분석** 및 props, 타입, 문서 추출
- 컴포넌트 구조와 컨텍스트 기반 JSDoc 주석 **생성**
- variant별 스토리를 포함한 Storybook 파일 자동 **생성**
- 대규모 코드베이스에서 컴포넌트 **검색** 및 탐색

**실제 사용 예시**: "Button 컴포넌트에 문서 추가해줘"라고 요청 → 코드 분석 후 JSDoc 제안 및 Storybook 파일 생성

---

## 도구 목록

### list_components

프로젝트 내 모든 React 컴포넌트 파일을 스캔하여 목록을 반환합니다.

**작동 방식**

1. `glob`을 사용하여 프로젝트 루트에서 `**/*.{tsx,jsx}` 패턴의 파일을 재귀적으로 검색합니다. `node_modules`와 `dist`는 제외됩니다.
2. `path.basename()`으로 파일 이름을 추출합니다. 예: `src/components/Button.tsx` → `Button`
3. 파일 이름이 `index`인 경우, 상위 디렉토리 이름을 사용합니다. 예: `src/components/Modal/index.tsx` → `Modal`
4. `namingConvention` 설정에 따라 컴포넌트 이름을 필터링합니다. `pascal`(예: `Button`)과 `kebab`(예: `user-profile`)을 지원하며, 여러 규칙이 지정된 경우 하나라도 일치하면 통과합니다.
5. `Button.tsx`와 `Button/index.tsx`가 모두 존재하는 경우 중복을 제거합니다.

**출력 예시**

```
Components (3):

- Button
- Card
- user-profile
```

---

### analyze_component

특정 컴포넌트 파일을 분석하여 props, 설명, 사용 예시를 포함한 문서를 자동 생성합니다.

**작동 방식**

1. `glob`을 사용하여 여러 패턴(`Button.tsx`, `Button/index.tsx` 등)으로 컴포넌트 파일을 검색합니다. 찾지 못하면 에러를 반환합니다.
2. 비동기 작업을 위해 `fs/promises`를 사용하여 컴포넌트 파일을 읽습니다.
3. TypeScript Compiler API를 사용하여 `type Props` 또는 `interface Props`를 파싱하고 prop 정의를 추출합니다. 같은 파일 내 타입 별칭(예: `type CardMode = "default" | "scroll"`)은 실제 값으로 표시됩니다. 외부 타입(예: `React.ButtonHTMLAttributes`)은 타입 이름만 표시됩니다.
4. 컴포넌트 함수 위의 JSDoc 주석을 파싱합니다.
5. 필수 props만 사용하여 샘플 사용 예시를 생성합니다. 샘플 값은 prop 타입에 따라 생성됩니다.

**출력 예시**

````markdown
Component "Button" in "/project/path/Button.tsx"

Description:
사용자 액션을 트리거하는 클릭 가능한 버튼 컴포넌트

Props (3):

- variant?: "primary" | "secondary"
  버튼의 시각적 스타일
- size?: "sm" | "md" | "lg"
  버튼 크기
- onClick: () => void
  클릭 이벤트 핸들러

Usage Example:

```tsx
import { Button } from './Button';

<Button onClick={() => {}}></Button>;
```
````

---

### suggest_description

문서가 없는 컴포넌트에 대해 적절한 JSDoc 설명을 생성하기 위한 컨텍스트 정보를 수집합니다.

**작동 방식**

1. **컴포넌트 파일 찾기**: `analyze_component`와 동일한 패턴 매칭으로 컴포넌트 파일을 찾습니다.
2. **Props 추출**: prop 정의를 파싱하여 컴포넌트가 받는 props를 확인합니다.
3. **코드 스니펫 추출**: 컴포넌트의 return 문(처음 10줄)을 캡처하여 무엇을 렌더링하는지 파악합니다.
4. **관련 컴포넌트 찾기**: 같은 디렉토리의 다른 컴포넌트를 검색하여 컴포넌트의 목적과 사용 패턴에 대한 컨텍스트를 제공합니다.
5. **파일 컨텍스트 수집**: 파일 경로를 포함하여 프로젝트 구조 내 컴포넌트 위치를 파악합니다.

**출력 예시**

```
Component: Button
Location: /path/to/shared/ui/elements/Button.tsx

Props (3):
- variant?: "primary" | "secondary"
- size?: "sm" | "md" | "lg"
- onClick: () => void

Code snippet:
return (
  <button
    className={`btn-${variant}`}
    onClick={onClick}
  >
    {children}
  </button>
);

Related components in same directory:
IconButton, LinkButton
```

---

### search_component

이름이나 키워드로 컴포넌트를 검색하여 일치하는 결과를 반환합니다.

**작동 방식**

1. **모든 컴포넌트 수집**: `list_components`와 동일한 컴포넌트 탐색을 사용하여 프로젝트의 모든 컴포넌트를 찾습니다.
2. **쿼리로 필터링**: 컴포넌트 이름에 대해 대소문자 구분 없는 부분 문자열 매칭을 수행합니다.
3. **일치 항목 반환**: 검색 쿼리가 포함된 모든 컴포넌트를 나열합니다.

**출력 예시**

```
Found 2 component(s) matching "button":

- Button
- IconButton
```

**사용 사례**

- 특정 기능과 관련된 모든 컴포넌트 찾기 (예: "auth", "form")
- 비슷한 이름의 컴포넌트 찾기 (예: "card" > Card, ProductCard, UserCard)
- 익숙하지 않은 코드에서 사용 가능한 컴포넌트 탐색
- 새 컴포넌트를 만들기 전에 컴포넌트 존재 여부 빠르게 확인

---

### create_storybook

컴포넌트의 props 정의를 기반으로 Storybook 파일을 생성합니다.

**작동 방식**

1. **컴포넌트 파일 찾기**: 다른 도구와 동일한 패턴 매칭으로 컴포넌트를 찾습니다.
2. **Props 추출**: prop 정의를 파싱하여 컴포넌트 입력을 파악합니다.
3. **템플릿 생성**: meta 설정과 기본 스토리가 포함된 Storybook 파일을 생성합니다. 컴포넌트에 variant props(variant, size, type)가 있으면 각 variant 값에 대한 추가 스토리를 자동 생성합니다.
4. **파일 저장**: 컴포넌트와 같은 디렉토리에 `.stories.tsx` 파일을 작성합니다.

---

## 프로젝트 구조

```
src/
├── index.ts                    # 서버 설정, 핸들러 등록
├── config.ts
├── types.ts
├── utils/
│   ├── componentUtils.ts       # 공유 유틸 함수
│   └── tsParser.ts             # TypeScript 파서
└── tools/
    ├── index.ts
    ├── list_components.ts      # 모든 컴포넌트 나열
    ├── analyze_component.ts    # 컴포넌트 상세 분석
    ├── suggest_description.ts  # JSDoc용 컨텍스트 수집
    ├── search_component.ts     # 키워드로 컴포넌트 검색
    └── create_storybook.ts     # Storybook 파일 생성
```

---

## 요구사항

- Node.js >= 18.0.0
- `.tsx` 또는 `.jsx` 컴포넌트가 있는 React/TypeScript 프로젝트
- (option) `create_storybook` 도구를 위한 Storybook

---

## 설치

```bash
npm install
npm run build
```

---

## 사용법

```json
{
  "mcpServers": {
    "component-doc": {
      "command": "node",
      "args": [
        "/path/to/component-doc-mcp/dist/index.js",
        "/path/to/your/project"
      ]
    }
  }
}
```

### MCP Inspector로 테스트

```bash
npx @modelcontextprotocol/inspector node dist/index.js /path/to/your/project
```

### 설정

설정은 **CLI 인자 > config.json > 기본값** 순서입니다.

| 옵션               | 기본값       | 설명                                   |
| ------------------ | ------------ | -------------------------------------- |
| `namingConvention` | `["pascal"]` | 포함할 네이밍 규칙. `pascal`과 `kebab` |

**config.json**

`/path/to/your/project` 프로젝트 루트에 `config.json` 파일

```json
{
  "namingConvention": ["pascal", "kebab"]
}
```

**CLI**

```bash
node dist/index.js /path/to/project --naming-convention pascal,kebab
```

또는

````json
```json
{
  "mcpServers": {
    "component-doc": {
      "command": "node",
      "args": [
        "/path/to/component-doc-mcp/dist/index.js",
        "/path/to/your/project",
        "--naming-convention",
        "pascal,kebab"
      ]
    }
  }
}
````

---

## 사용 예시

```
사용자: "프로젝트의 모든 컴포넌트 보여줘"
→ Claude가 list_components 호출

사용자: "Button 컴포넌트 어떻게 써?"
→ Claude가 analyze_component 호출

사용자: "Card 컴포넌트에 JSDoc 설명 추가해줘"
→ Claude가 suggest_description 호출
→ Claude가 props와 코드 기반으로 설명 제안
→ 사용자 승인 후 Claude가 파일에 JSDoc 추가

사용자: "Modal에 Storybook 파일 만들어줘"
→ Claude가 create_storybook 호출
→ variant 스토리가 포함된 Modal.stories.tsx 생성
```
