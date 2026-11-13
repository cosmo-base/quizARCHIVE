/**
 * 画面のURL。GitHub Pages（静的書き出し）では動的なパスを事前に作れないため、
 * ID はクエリパラメータで渡す。
 */
const q = (id: string) => encodeURIComponent(id)

export const routes = {
  attempt: (id: string) => `/attempts?id=${q(id)}`,
  result: (id: string) => `/attempts/result?id=${q(id)}`,
  question: (id: string) => `/questions/detail?id=${q(id)}`,
  notice: (id: string) => `/notices/detail?id=${q(id)}`,
}
