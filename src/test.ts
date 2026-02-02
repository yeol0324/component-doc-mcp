const sampleCode = `
/**
 * 사용자 액션을 트리거하는 버튼 컴포넌트
 * 다양한 variant와 크기를 지원합니다.
 */
export function Button() {}
`;

const jsDocMatch = sampleCode.match(
  /\/\*\*\s*\n([\s\S]*?)\*\/\s*(?:export\s+)?(?:const|function)/,
);

if (jsDocMatch?.[1]) {
  const rawComment = jsDocMatch[1];
  console.log(rawComment);
  const cleanedComment = rawComment
    .split('\n')
    .map((line) => line.replace('*', '').trim())
    .join('\n');

  console.log(cleanedComment);
}
//3. 없을 때 처리
