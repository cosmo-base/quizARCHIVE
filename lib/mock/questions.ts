import type { CategoryId, Reference } from '@/lib/domain/types'

export interface RawQuestion {
  category: CategoryId
  text: string
  /** 先頭が正解。表示順は seed で決める */
  choices: [string, string, string, string]
  explanation: string
  references?: Reference[]
  /** SNS正答率（仮）。null は欠損 */
  sns: number | null
}

const JAXA: Reference = { title: 'JAXA 宇宙航空研究開発機構 公式サイト', publisher: 'JAXA', url: 'https://www.jaxa.jp/' }
const NAOJ: Reference = { title: '国立天文台 公式サイト', publisher: '国立天文台', url: 'https://www.nao.ac.jp/' }
const NASA: Reference = { title: 'NASA Science', publisher: 'NASA', url: 'https://science.nasa.gov/' }

/**
 * V0モック用のサンプル問題（仮データ）。実際の過去問とは異なる。
 * 実データ連携時は元スプレッドシートから取り込む（TBD-10）。
 */
export const RAW_QUESTIONS: RawQuestion[] = [
  { category: 'solar', text: '太陽系で最も大きい惑星はどれ？', choices: ['木星', '土星', '天王星', '海王星'], explanation: '木星は赤道半径が地球の約11倍あり、太陽系最大の惑星です。', references: [NASA], sns: 0.92 },
  { category: 'solar', text: '月がいつも地球に同じ面を向けている主な理由は？', choices: ['自転周期と公転周期が等しいから（潮汐固定）', '月が自転していないから', '地球の磁場に引きつけられているから', '太陽光の当たり方が一定だから'], explanation: '月は約27.3日で自転と公転を行うため、地球からは常にほぼ同じ面が見えます。これを潮汐固定（同期自転）といいます。', references: [NAOJ], sns: 0.63 },
  { category: 'solar', text: '太陽系最大級の火山「オリンポス山」がある天体は？', choices: ['火星', '金星', 'イオ', '水星'], explanation: 'オリンポス山は火星にある楯状火山で、高さは周囲から約2万メートル以上に達します。', references: [NASA], sns: 0.58 },
  { category: 'solar', text: '濃い大気をもつことで知られる土星の衛星は？', choices: ['タイタン', 'エンケラドゥス', 'ミマス', 'イアペトゥス'], explanation: 'タイタンは窒素を主成分とする厚い大気をもち、地表の気圧は地球の約1.5倍です。', references: [NASA], sns: 0.41 },
  { category: 'solar', text: '2006年のIAU総会で、惑星から準惑星へ分類が変更された天体は？', choices: ['冥王星', '海王星', 'カロン', 'ベスタ'], explanation: '2006年の国際天文学連合（IAU）総会で惑星の定義が決まり、冥王星は準惑星に分類されました。', references: [NAOJ], sns: 0.88 },
  { category: 'solar', text: '1天文単位（太陽と地球の平均距離）に最も近いのは？', choices: ['約1億5000万km', '約3億8000万km', '約1500万km', '約15億km'], explanation: '1天文単位は149,597,870,700 mと定義されており、約1億5000万kmです。', references: [NAOJ], sns: 0.34 },
  { category: 'solar', text: '金星の自転の特徴として正しいものは？', choices: ['公転と逆向きに自転している', '自転していない', '1日に2回自転する', '地球とほぼ同じ周期で自転する'], explanation: '金星は公転と逆向きに、約243日かけてゆっくり自転しています（逆行自転）。', references: [NASA], sns: 0.22 },

  { category: 'stellar', text: '太陽を除いて、地球に最も近い恒星は？', choices: ['プロキシマ・ケンタウリ', 'シリウス', 'ベテルギウス', 'ベガ'], explanation: 'プロキシマ・ケンタウリは約4.2光年の距離にある赤色矮星です。', references: [NASA], sns: 0.71 },
  { category: 'stellar', text: '天の川銀河に最も近い大型の渦巻銀河は？', choices: ['アンドロメダ銀河', '大マゼラン雲', 'ソンブレロ銀河', '子持ち銀河'], explanation: 'アンドロメダ銀河（M31）は約250万光年の距離にある大型の渦巻銀河です。大マゼラン雲はより近いものの、矮小銀河です。', references: [NAOJ], sns: 0.47 },
  { category: 'stellar', text: '太陽を除いて、夜空で最も明るく見える恒星は？', choices: ['シリウス', 'カノープス', 'ベガ', 'ポラリス'], explanation: 'おおいぬ座のシリウスは見かけの等級が約−1.46等で、全天で最も明るい恒星です。', references: [NAOJ], sns: 0.66 },
  { category: 'stellar', text: '表面温度が最も高いのはどの色に見える恒星？', choices: ['青白い星', '赤い星', '黄色い星', 'オレンジ色の星'], explanation: '恒星の色は表面温度を反映し、青白い星ほど高温、赤い星ほど低温です。', references: [NAOJ], sns: 0.52 },
  { category: 'stellar', text: '太陽程度の質量の恒星が最終的に残す天体は？', choices: ['白色矮星', '中性子星', 'ブラックホール', '褐色矮星'], explanation: '太陽程度の恒星は赤色巨星を経て外層を放出し、中心に白色矮星を残します。', references: [NAOJ], sns: 0.38 },
  { category: 'stellar', text: '国際天文学連合（IAU）が定めている星座の数は？', choices: ['88', '48', '72', '108'], explanation: '1928年にIAUが全天を88の星座に区分しました。48はプトレマイオスの星座数です。', references: [NAOJ], sns: 0.27 },

  { category: 'physics', text: '光が1年間に進む距離を表す単位は？', choices: ['光年', 'パーセク', '天文単位', 'キロパーセク'], explanation: '1光年は約9.46兆kmです。パーセクは年周視差に基づく距離の単位です。', references: [NAOJ], sns: 0.95 },
  { category: 'physics', text: '宇宙マイクロ波背景放射の現在の温度に最も近いのは？', choices: ['約2.7K', '約27K', '約0.27K', '約270K'], explanation: '宇宙マイクロ波背景放射は約2.725Kの黒体放射として観測されています。', references: [NASA], sns: 0.19 },
  { category: 'physics', text: '2015年に初めて直接検出された「時空のさざ波」は？', choices: ['重力波', 'ガンマ線バースト', '高速電波バースト', 'ニュートリノ振動'], explanation: 'LIGOが2015年9月にブラックホール連星の合体による重力波を初めて直接検出しました。', references: [NAOJ], sns: 0.61 },
  { category: 'physics', text: '銀河の後退速度が距離に比例するという関係は？', choices: ['ハッブル–ルメートルの法則', 'ケプラーの第三法則', 'ティティウス・ボーデの法則', 'ステファン・ボルツマンの法則'], explanation: '宇宙膨張を示す関係で、2018年にIAUがハッブル–ルメートルの法則と呼ぶことを推奨しました。', references: [NAOJ], sns: 0.29 },
  { category: 'physics', text: '太陽のエネルギー源となっている主な反応は？', choices: ['水素の核融合', 'ウランの核分裂', '化学的な燃焼', '自転による摩擦熱'], explanation: '太陽の中心部では水素がヘリウムに変わる核融合反応が起きています。', references: [NASA], sns: 0.83 },
  { category: 'physics', text: '2019年にEHT（イベント・ホライズン・テレスコープ）が初めて公開したブラックホールの画像は、どの天体のもの？', choices: ['M87', 'いて座A*', 'はくちょう座X-1', 'M31'], explanation: '2019年4月、楕円銀河M87の中心にある巨大ブラックホールのシャドウが公開されました。いて座A*の画像公開は2022年です。', references: [NAOJ], sns: 0.08 },

  { category: 'history', text: '世界初の人工衛星は？', choices: ['スプートニク1号', 'エクスプローラー1号', 'ボストーク1号', 'おおすみ'], explanation: '1957年10月4日、ソ連がスプートニク1号を打ち上げました。', references: [NASA], sns: 0.81 },
  { category: 'history', text: '人類で初めて宇宙飛行をしたのは？', choices: ['ユーリイ・ガガーリン', 'ニール・アームストロング', 'ジョン・グレン', 'アラン・シェパード'], explanation: '1961年4月12日、ガガーリンがボストーク1号で地球を周回しました。', references: [NASA], sns: 0.86 },
  { category: 'history', text: '日本初の人工衛星は？', choices: ['おおすみ', 'ひまわり', 'はやぶさ', 'かぐや'], explanation: '1970年2月11日、東京大学宇宙航空研究所がL-4Sロケットで「おおすみ」を打ち上げました。', references: [JAXA], sns: 0.44 },
  { category: 'history', text: '人類が初めて月面に着陸したミッションは？', choices: ['アポロ11号', 'アポロ8号', 'アポロ13号', 'ジェミニ7号'], explanation: '1969年7月20日、アポロ11号の着陸船イーグルが月面に着陸しました。', references: [NASA], sns: 0.9 },
  { category: 'history', text: '小惑星イトカワから微粒子を持ち帰った探査機は？', choices: ['はやぶさ', 'はやぶさ2', 'あかつき', 'みちびき'], explanation: '「はやぶさ」は2010年に地球へ帰還し、イトカワの微粒子を届けました。はやぶさ2の目的地はリュウグウです。', references: [JAXA], sns: 0.57 },
  { category: 'history', text: '日本人として初めて宇宙へ行った人物は？', choices: ['秋山豊寛', '毛利衛', '向井千秋', '若田光一'], explanation: '1990年、TBS記者の秋山豊寛さんがソユーズで宇宙ステーション・ミールを訪れました。', references: [JAXA], sns: 0.16 },

  { category: 'tech', text: '国際宇宙ステーション（ISS）が飛行するおおよその高度は？', choices: ['約400km', '約36,000km', '約40km', '約4,000km'], explanation: 'ISSは高度約400kmを約90分で地球を一周しています。', references: [JAXA], sns: 0.69 },
  { category: 'tech', text: '静止衛星が周回する高度はおよそ何km？', choices: ['約36,000km', '約400km', '約20,000km', '約384,000km'], explanation: '赤道上空約35,786kmでは、衛星の周期が地球の自転周期と一致します。', references: [JAXA], sns: 0.36 },
  { category: 'tech', text: 'H-IIAロケットの後継として開発された日本の基幹ロケットは？', choices: ['H3ロケット', 'イプシロンロケット', 'M-Vロケット', 'H-IIBロケット'], explanation: 'H3ロケットはH-IIAの後継となる日本の新しい基幹ロケットです。', references: [JAXA], sns: 0.74 },
  { category: 'tech', text: 'ISSにある日本の実験棟の愛称は？', choices: ['きぼう', 'こうのとり', 'みらい', 'だいち'], explanation: '日本実験棟「きぼう」はISS最大の実験モジュールです。「こうのとり」は補給機の愛称です。', references: [JAXA], sns: 0.78 },
  { category: 'tech', text: '地球の重力圏を脱出するのに必要な速度（第二宇宙速度）は約何km/s？', choices: ['約11.2km/s', '約7.9km/s', '約16.7km/s', '約3.0km/s'], explanation: '第一宇宙速度は約7.9km/s、第二宇宙速度は約11.2km/s、第三宇宙速度は約16.7km/sです。', references: [JAXA], sns: 0.24 },
]
