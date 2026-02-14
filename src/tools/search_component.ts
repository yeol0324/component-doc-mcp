import type { Config } from '../types.js';
import { getAllComponents } from '../utils/componentUtils.js';

export async function searchComponent(
  query: string,
  projectRoot: string,
  config: Config,
): Promise<string> {
  const allComponents = await getAllComponents(projectRoot, config);

  // TODO: query와 매칭되는 것만 필터링
  //  결과 포맷팅
  return new Promise(() => {});
}
