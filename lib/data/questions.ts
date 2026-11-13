import type { Field, QuestionContent, QuestionDifficulty, QuestionStats, Reference } from '../types'

/** モック用の仮分類 */
export const fields: Field[] = [
  { id: 'solar', name: '太陽系' },
  { id: 'stars', name: '恒星と銀河' },
  { id: 'exploration', name: '宇宙開発・探査' },
  { id: 'observation', name: '星空と観測' },
  { id: 'physics', name: '宇宙のしくみ' },
  { id: 'life', name: '宇宙と暮らし' },
]

const ref = {
  naoj: { title: '国立天文台', publisher: '国立天文台', url: 'https://www.nao.ac.jp/' },
  koyomi: { title: '暦計算室', publisher: '国立天文台', url: 'https://eco.mtk.nao.ac.jp/koyomi/' },
  jaxa: { title: 'JAXA 宇宙航空研究開発機構', publisher: 'JAXA', url: 'https://www.jaxa.jp/' },
  jaxaHuman: { title: 'JAXA 有人宇宙技術部門', publisher: 'JAXA', url: 'https://humans-in-space.jaxa.jp/' },
  nasaSolar: { title: 'Solar System Exploration', publisher: 'NASA', url: 'https://science.nasa.gov/solar-system/' },
  nasa: { title: 'NASA Science', publisher: 'NASA', url: 'https://science.nasa.gov/' },
  esa: { title: 'European Space Agency', publisher: 'ESA', url: 'https://www.esa.int/' },
  iau: { title: 'International Astronomical Union', publisher: 'IAU', url: 'https://www.iau.org/' },
} satisfies Record<string, Reference>

interface Seed {
  id: string
  fieldId: string
  target: QuestionDifficulty
  text: string
  choices: string[]
  correct: number
  explanation: string
  references?: Reference[]
}

const choiceIds = ['a', 'b', 'c', 'd', 'e']

const seeds: Seed[] = [
  // 太陽系
  { id: 'Q-001', fieldId: 'solar', target: 'beginner', text: '太陽系で最も大きな惑星はどれでしょう？', choices: ['木星', '土星', '海王星'], correct: 0, explanation: '木星は直径が地球の約11倍あり、太陽系の惑星で最も大きな惑星です。', references: [ref.nasaSolar] },
  { id: 'Q-002', fieldId: 'solar', target: 'beginner', text: '表面が赤っぽく見えることから「赤い惑星」と呼ばれる惑星はどれでしょう？', choices: ['金星', '火星', '水星'], correct: 1, explanation: '火星の地表には酸化鉄を含む赤い砂や岩が多く、赤っぽく見えます。', references: [ref.nasaSolar] },
  { id: 'Q-003', fieldId: 'solar', target: 'beginner', text: '大きく美しい環（リング）がよく知られている惑星はどれでしょう？', choices: ['火星', '水星', '土星'], correct: 2, explanation: '土星の環は氷や岩のかけらが集まってできています。木星・天王星・海王星にも環はありますが、土星の環が最も目立ちます。', references: [ref.nasaSolar] },
  { id: 'Q-004', fieldId: 'solar', target: 'beginner', text: '太陽に最も近い軌道を回っている惑星はどれでしょう？', choices: ['水星', '金星', '地球'], correct: 0, explanation: '太陽に近い順に、水星・金星・地球・火星と並んでいます。', references: [] },
  { id: 'Q-005', fieldId: 'solar', target: 'beginner', text: '月が地球の周りを1周する（恒星に対して元の位置に戻る）のにかかる期間は、およそどれくらいでしょう？', choices: ['約7日', '約27日', '約365日'], correct: 1, explanation: '恒星に対する月の公転周期（恒星月）は約27.3日です。満ち欠けの周期（朔望月）は地球の公転の影響で約29.5日と少し長くなります。', references: [ref.koyomi] },
  { id: 'Q-006', fieldId: 'solar', target: 'intermediate', text: '金星の自転について正しい説明はどれでしょう？', choices: ['地球と同じ向きで、1日より短い周期で自転している', '多くの惑星と逆向きに、とてもゆっくり自転している', 'まったく自転していない'], correct: 1, explanation: '金星は多くの惑星と逆向きに自転しており、自転周期は約243日と公転周期（約225日）より長いことが知られています。', references: [ref.nasaSolar] },
  { id: 'Q-007', fieldId: 'solar', target: 'intermediate', text: '冥王星は2006年の国際天文学連合の決定で、何に分類されることになったでしょう？', choices: ['準惑星', '衛星', '彗星'], correct: 0, explanation: '2006年の国際天文学連合総会で惑星の定義が決まり、冥王星は「準惑星」に分類されました。', references: [ref.iau] },
  { id: 'Q-008', fieldId: 'solar', target: 'intermediate', text: '小惑星が多く集まる「小惑星帯（メインベルト）」が主にあるのはどこでしょう？', choices: ['地球と火星の間', '火星と木星の間', '土星と天王星の間'], correct: 1, explanation: '多くの小惑星は火星と木星の軌道の間にある小惑星帯を公転しています。', references: [] },
  { id: 'Q-009', fieldId: 'solar', target: 'intermediate', text: '次のうち、木星の「ガリレオ衛星」ではないものはどれでしょう？', choices: ['イオ', 'エウロパ', 'タイタン', 'カリスト'], correct: 2, explanation: 'ガリレオ衛星はイオ・エウロパ・ガニメデ・カリストの4つです。タイタンは土星の最大の衛星です。', references: [ref.nasaSolar] },
  { id: 'Q-010', fieldId: 'solar', target: 'advanced', text: '太陽系で最も大きな衛星はどれでしょう？', choices: ['タイタン', '月', 'ガニメデ'], correct: 2, explanation: '木星の衛星ガニメデは直径約5,300kmで、惑星の水星よりも大きい太陽系最大の衛星です。', references: [ref.nasaSolar] },
  { id: 'Q-011', fieldId: 'solar', target: 'advanced', text: '天王星の特徴として正しいものはどれでしょう？', choices: ['自転軸が大きく傾き、横倒しに近い状態で公転している', '太陽系で最も表面温度が高い惑星である', '環をまったく持たない'], correct: 0, explanation: '天王星の自転軸は約98度傾いており、横倒しに近い姿勢で太陽の周りを回っています。また、細い環も持っています。', references: [ref.nasaSolar] },
  { id: 'Q-012', fieldId: 'solar', target: 'advanced', text: '地球と太陽の平均距離をもとにした長さの単位はどれでしょう？', choices: ['光年', '天文単位（au）', 'パーセク'], correct: 1, explanation: '1天文単位（au）は約1億4,960万kmで、太陽系内の距離を表すのによく使われます。', references: [ref.iau] },
  { id: 'Q-013', fieldId: 'solar', target: 'advanced', text: '彗星が太陽に近づいたときに見られる「尾」が、太陽と反対の方向へ伸びる主な理由はどれでしょう？', choices: ['太陽からの光の圧力や太陽風に押されるため', '彗星の進行方向の後ろに必ずできるため', '地球の重力に引かれるため'], correct: 0, explanation: '彗星の尾は太陽の放射圧や太陽風によって押し出されるため、進行方向とは関係なく、おおむね太陽と反対側へ伸びます。', references: [] },
  { id: 'Q-014', fieldId: 'solar', target: 'expert', text: '2006年に国際天文学連合が定めた「惑星」の条件に含まれないものはどれでしょう？', choices: ['太陽の周りを回っている', '自分の重力で球形に近い形になっている', '軌道の周辺から他の天体を排除している', '表面に液体の水がある'], correct: 3, explanation: '惑星の定義は「太陽の周りを回る」「自己重力で球形に近い」「軌道周辺の他の天体を排除している」の3条件です。水の有無は含まれません。', references: [ref.iau] },
  { id: 'Q-015', fieldId: 'solar', target: 'expert', text: '海王星の最大の衛星トリトンの公転の特徴として正しいものはどれでしょう？', choices: ['海王星の自転と逆向きに公転している（逆行軌道）', '海王星の環の内側を公転している', '公転周期が1年以上ある'], correct: 0, explanation: 'トリトンは大きな衛星としては珍しく逆行軌道を持ち、海王星に捕獲された天体ではないかと考えられています。', references: [ref.nasaSolar] },

  // 恒星と銀河
  { id: 'Q-016', fieldId: 'stars', target: 'beginner', text: '太陽はどのような種類の天体でしょう？', choices: ['惑星', '恒星', '衛星'], correct: 1, explanation: '太陽は自ら光と熱を出して輝く恒星です。', references: [] },
  { id: 'Q-017', fieldId: 'stars', target: 'beginner', text: '太陽を除いて、夜空で最も明るく見える恒星はどれでしょう？', choices: ['北極星', 'ベガ', 'シリウス'], correct: 2, explanation: 'おおいぬ座のシリウスは、太陽を除くと全天で最も明るく見える恒星です。', references: [ref.naoj] },
  { id: 'Q-018', fieldId: 'stars', target: 'beginner', text: '私たちの太陽系が属している銀河はどれでしょう？', choices: ['アンドロメダ銀河', '天の川銀河（銀河系）', '大マゼラン雲'], correct: 1, explanation: '太陽系は天の川銀河（銀河系）の円盤部にあります。', references: [] },
  { id: 'Q-019', fieldId: 'stars', target: 'beginner', text: '恒星の色が青白いほど、その表面温度はどうなっているでしょう？', choices: ['高い', '低い', '色と温度は関係ない'], correct: 0, explanation: '恒星は表面温度が高いほど青白く、低いほど赤っぽく見えます。', references: [] },
  { id: 'Q-020', fieldId: 'stars', target: 'beginner', text: '「1光年」は何を表す単位でしょう？', choices: ['光が1年間に進む距離', '光が1日に進む距離', '地球が1年間に進む距離'], correct: 0, explanation: '1光年は光が1年間に進む距離で、約9兆4,600億kmです。時間ではなく距離の単位です。', references: [ref.naoj] },
  { id: 'Q-022', fieldId: 'stars', target: 'intermediate', text: '太陽が光り輝くエネルギーの源はどれでしょう？', choices: ['表面での燃焼（化学反応）', '中心部での水素の核融合', '重力による収縮だけ'], correct: 1, explanation: '太陽の中心部では水素がヘリウムに変わる核融合反応が起きており、そのエネルギーで輝いています。', references: [ref.nasa] },
  { id: 'Q-023', fieldId: 'stars', target: 'intermediate', text: 'オリオン座で赤く輝く1等星はどれでしょう？', choices: ['リゲル', 'アルデバラン', 'ベテルギウス'], correct: 2, explanation: 'ベテルギウスはオリオン座の赤い1等星です。同じオリオン座のリゲルは青白く輝きます。', references: [] },
  { id: 'Q-024', fieldId: 'stars', target: 'intermediate', text: '天の川銀河の近くにある大きな渦巻銀河で、地球から約250万光年離れているのはどれでしょう？', choices: ['アンドロメダ銀河', '大マゼラン雲', 'ソンブレロ銀河'], correct: 0, explanation: 'アンドロメダ銀河（M31）は約250万光年の距離にある大きな渦巻銀河で、条件が良ければ肉眼でも見えます。', references: [ref.nasa] },
  { id: 'Q-025', fieldId: 'stars', target: 'advanced', text: '太陽くらいの質量の恒星が一生の最後に残す天体はどれでしょう？', choices: ['ブラックホール', '中性子星', '白色矮星'], correct: 2, explanation: '太陽程度の質量の恒星は、外層を放出した後に白色矮星を残すと考えられています。中性子星やブラックホールはより重い恒星の最期です。', references: [] },
  { id: 'Q-026', fieldId: 'stars', target: 'advanced', text: '星の明るさを表す「等級」について正しいものはどれでしょう？', choices: ['数字が大きいほど明るい', '数字が小さいほど明るい', '1等級違うと明るさはちょうど10倍違う'], correct: 1, explanation: '等級は数字が小さいほど明るく、1等級の差は明るさで約2.5倍、5等級の差でちょうど100倍になります。', references: [ref.naoj] },
  { id: 'Q-027', fieldId: 'stars', target: 'advanced', text: '天の川銀河の中心にある超大質量ブラックホールは何と呼ばれているでしょう？', choices: ['はくちょう座X-1', 'いて座A*（エースター）', 'M87*'], correct: 1, explanation: '天の川銀河の中心にある超大質量ブラックホールは「いて座A*」と呼ばれ、2022年に国際共同観測による画像が公開されました。', references: [ref.naoj] },
  { id: 'Q-028', fieldId: 'stars', target: 'expert', text: '恒星のスペクトル型を、表面温度が高い順に並べたものはどれでしょう？', choices: ['O・B・A・F・G・K・M', 'M・K・G・F・A・B・O', 'A・B・F・G・K・M・O'], correct: 0, explanation: 'スペクトル型は高温側からO・B・A・F・G・K・Mと並びます。太陽はG型に分類されます。', references: [] },
  { id: 'Q-029', fieldId: 'stars', target: 'expert', text: 'セファイド変光星が天体までの距離を測るのに使える理由はどれでしょう？', choices: ['常に同じ色で光るため', '変光の周期と本来の明るさ（絶対等級）に関係があるため', '距離に関係なく同じ明るさに見えるため'], correct: 1, explanation: 'セファイド変光星は周期と光度に関係（周期光度関係）があり、周期から本来の明るさがわかるため、見かけの明るさと比べて距離を求められます。', references: [] },
  { id: 'Q-030', fieldId: 'stars', target: 'expert', text: '高速で自転し、規則正しい電波などのパルスを出す中性子星を何と呼ぶでしょう？', choices: ['クエーサー', 'パルサー', 'ブレーザー'], correct: 1, explanation: 'パルサーは高速で自転する中性子星で、灯台のように規則正しいパルスが観測されます。', references: [] },

  // 宇宙開発・探査
  { id: 'Q-031', fieldId: 'exploration', target: 'beginner', text: '1969年に人類が初めて月面に降り立ったミッションはどれでしょう？', choices: ['アポロ11号', 'アポロ13号', 'ジェミニ4号'], correct: 0, explanation: '1969年7月、アポロ11号のアームストロング船長とオルドリン飛行士が人類で初めて月面に降り立ちました。', references: [ref.nasa] },
  { id: 'Q-032', fieldId: 'exploration', target: 'beginner', text: '日本の宇宙航空研究開発機構の略称はどれでしょう？', choices: ['NASA', 'ESA', 'JAXA'], correct: 2, explanation: 'JAXA（Japan Aerospace Exploration Agency）は日本の宇宙航空研究開発機構です。', references: [ref.jaxa] },
  { id: 'Q-033', fieldId: 'exploration', target: 'beginner', text: '世界で初めて打ち上げられた人工衛星はどれでしょう？', choices: ['エクスプローラー1号', 'スプートニク1号', 'おおすみ'], correct: 1, explanation: '1957年、旧ソ連のスプートニク1号が世界初の人工衛星として打ち上げられました。', references: [] },
  { id: 'Q-034', fieldId: 'exploration', target: 'beginner', text: '人類で初めて宇宙を飛行した人物は誰でしょう？', choices: ['ユーリ・ガガーリン', 'ニール・アームストロング', 'ジョン・グレン'], correct: 0, explanation: '1961年、旧ソ連のユーリ・ガガーリンがボストーク1号で人類初の宇宙飛行を行いました。', references: [] },
  { id: 'Q-035', fieldId: 'exploration', target: 'beginner', text: '小惑星イトカワから試料を持ち帰った日本の探査機はどれでしょう？', choices: ['あかつき', 'はやぶさ2', 'はやぶさ'], correct: 2, explanation: '初代「はやぶさ」は2010年に小惑星イトカワの微粒子を地球に持ち帰りました。', references: [ref.jaxa] },
  { id: 'Q-036', fieldId: 'exploration', target: 'intermediate', text: '日本で初めて打ち上げられた人工衛星はどれでしょう？', choices: ['ひまわり', 'おおすみ', 'かぐや'], correct: 1, explanation: '1970年に打ち上げられた「おおすみ」が日本初の人工衛星です。', references: [ref.jaxa] },
  { id: 'Q-037', fieldId: 'exploration', target: 'intermediate', text: '「はやぶさ2」が試料を採取した小惑星はどれでしょう？', choices: ['リュウグウ', 'イトカワ', 'ベンヌ'], correct: 0, explanation: '「はやぶさ2」は小惑星リュウグウで試料を採取し、2020年にカプセルを地球に届けました。', references: [ref.jaxa] },
  { id: 'Q-038', fieldId: 'exploration', target: 'intermediate', text: '金星の周回軌道から大気を観測した日本の探査機はどれでしょう？', choices: ['のぞみ', 'みちびき', 'あかつき'], correct: 2, explanation: '金星探査機「あかつき」は2015年に金星周回軌道に入り、金星の大気を観測しました。', references: [ref.jaxa] },
  { id: 'Q-039', fieldId: 'exploration', target: 'intermediate', text: '2024年1月に日本の探査機として初めて月面着陸に成功した小型月着陸実証機はどれでしょう？', choices: ['かぐや', 'SLIM', 'LUNAR-A'], correct: 1, explanation: 'SLIM（小型月着陸実証機）は2024年1月に月面着陸に成功し、ねらった地点へのピンポイント着陸を実証しました。', references: [ref.jaxa] },
  { id: 'Q-040', fieldId: 'exploration', target: 'advanced', text: '2012年に太陽圏を出て星間空間に到達したとされる探査機はどれでしょう？', choices: ['ボイジャー1号', 'パイオニア10号', 'ニュー・ホライズンズ'], correct: 0, explanation: '1977年に打ち上げられたボイジャー1号は、2012年に太陽圏の外側（星間空間）に到達したとされています。', references: [ref.nasa] },
  { id: 'Q-041', fieldId: 'exploration', target: 'advanced', text: '2015年に冥王星へ接近し、詳しく観測した探査機はどれでしょう？', choices: ['カッシーニ', 'ジュノー', 'ニュー・ホライズンズ'], correct: 2, explanation: 'ニュー・ホライズンズは2015年7月に冥王星へ最接近し、ハート形の地形などを撮影しました。', references: [ref.nasa] },
  { id: 'Q-042', fieldId: 'exploration', target: 'advanced', text: '土星を周回して観測し、2017年に土星の大気へ突入して運用を終えた探査機はどれでしょう？', choices: ['ガリレオ', 'カッシーニ', 'マゼラン'], correct: 1, explanation: 'カッシーニは約13年間土星を周回観測し、2017年に土星大気へ突入して運用を終えました。', references: [ref.nasa] },
  { id: 'Q-043', fieldId: 'exploration', target: 'expert', text: 'ジェイムズ・ウェッブ宇宙望遠鏡が配置されている場所はどこでしょう？', choices: ['地球の低軌道', '月の周回軌道', '太陽と地球のラグランジュ点L2付近'], correct: 2, explanation: 'ジェイムズ・ウェッブ宇宙望遠鏡は地球から約150万km離れた太陽-地球系のL2付近を回る軌道で観測しています。', references: [ref.nasa, ref.esa] },
  { id: 'Q-044', fieldId: 'exploration', target: 'expert', text: '「はやぶさ2」がリュウグウに人工クレーターを作るために使った装置はどれでしょう？', choices: ['衝突装置（SCI）', 'ターゲットマーカー', 'イオンエンジン'], correct: 0, explanation: '「はやぶさ2」は衝突装置（SCI）で金属の弾丸を撃ち込み、人工クレーターを作って地下の物質を露出させました。', references: [ref.jaxa] },
  { id: 'Q-045', fieldId: 'exploration', target: 'expert', text: '人類が初めて月の周回軌道に入り、月の裏側を直接目で見たミッションはどれでしょう？', choices: ['ルナ3号', 'アポロ8号', 'アポロ11号'], correct: 1, explanation: '1968年12月のアポロ8号で、人類は初めて月を周回し月の裏側を直接見ました。ルナ3号は無人で月の裏側を初めて撮影した探査機です。', references: [] },

  // 星空と観測
  { id: 'Q-046', fieldId: 'observation', target: 'beginner', text: '北の空でほとんど位置が変わらないように見える星はどれでしょう？', choices: ['北極星', 'シリウス', 'ベガ'], correct: 0, explanation: '北極星は地球の自転軸の延長線近くにあるため、一晩中ほとんど動かないように見えます。', references: [] },
  { id: 'Q-047', fieldId: 'observation', target: 'beginner', text: '満月のとき、太陽・地球・月はどのように並んでいるでしょう？', choices: ['太陽・月・地球の順にほぼ一直線', '太陽・地球・月の順にほぼ一直線', '3つが直角の位置に並ぶ'], correct: 1, explanation: '満月は、地球をはさんで月が太陽の反対側にあるときに見えます。', references: [ref.koyomi] },
  { id: 'Q-048', fieldId: 'observation', target: 'beginner', text: '次のうち「夏の大三角」をつくる星ではないものはどれでしょう？', choices: ['ベガ', 'アルタイル', 'デネブ', 'ベテルギウス'], correct: 3, explanation: '夏の大三角はベガ・アルタイル・デネブで作られます。ベテルギウスは冬の大三角をつくる星の一つです。', references: [] },
  { id: 'Q-049', fieldId: 'observation', target: 'beginner', text: '流れ星（流星）の正体として正しいものはどれでしょう？', choices: ['恒星が落ちてくる現象', '人工衛星が太陽の光を反射する現象', '宇宙のちりが地球の大気に飛び込んで光る現象'], correct: 2, explanation: '流星は、宇宙空間のちりが高速で大気に突入し、大気と衝突して光る現象です。', references: [ref.naoj] },
  { id: 'Q-050', fieldId: 'observation', target: 'beginner', text: '月が満ち欠けして元の形に戻るまでの期間は、およそどれくらいでしょう？', choices: ['約15日', '約29.5日', '約45日'], correct: 1, explanation: '新月から次の新月までの周期（朔望月）は約29.5日です。', references: [ref.koyomi] },
  { id: 'Q-051', fieldId: 'observation', target: 'intermediate', text: '毎年8月中旬ごろに活動のピークを迎える流星群はどれでしょう？', choices: ['しぶんぎ座流星群', 'ペルセウス座流星群', 'ふたご座流星群'], correct: 1, explanation: 'ペルセウス座流星群は8月中旬ごろが見ごろです。しぶんぎ座流星群は1月、ふたご座流星群は12月が見ごろです。', references: [ref.naoj] },
  { id: 'Q-052', fieldId: 'observation', target: 'intermediate', text: '皆既月食のとき、月が赤銅色に見える主な理由はどれでしょう？', choices: ['地球の大気を通って屈折した赤い光が月を照らすため', '月の表面が熱くなるため', '太陽の黒点が増えるため'], correct: 0, explanation: '地球の大気を通過する際に青い光は散乱され、残った赤い光が屈折して地球の影の中の月を照らすため、赤銅色に見えます。', references: [ref.naoj] },
  { id: 'Q-053', fieldId: 'observation', target: 'intermediate', text: '金星が「明けの明星」として見えるのは、いつ・どの方角の空でしょう？', choices: ['夕方の西の空', '真夜中の南の空', '明け方の東の空'], correct: 2, explanation: '金星は太陽から大きく離れないため、明け方の東の空（明けの明星）か夕方の西の空（宵の明星）に見えます。', references: [] },
  { id: 'Q-054', fieldId: 'observation', target: 'intermediate', text: '天体望遠鏡の「口径」が大きいと、主に何が良くなるでしょう？', choices: ['集められる光が増え、暗い天体が見やすくなる', '倍率が必ず高くなる', '視野が必ず広くなる'], correct: 0, explanation: '口径が大きいほど多くの光を集められ、暗い天体が見えやすく、細かいところまで見分ける能力（分解能）も高くなります。', references: [] },
  { id: 'Q-055', fieldId: 'observation', target: 'advanced', text: '星が一晩のうちに東から西へ動いていくように見える主な理由はどれでしょう？', choices: ['地球の公転', '星自身の移動', '地球の自転'], correct: 2, explanation: '地球が西から東へ自転しているため、星は東から昇って西へ沈むように見えます（日周運動）。', references: [] },
  { id: 'Q-056', fieldId: 'observation', target: 'advanced', text: '「年周視差」が示している現象はどれでしょう？', choices: ['地球の公転によって、近い恒星の見かけの位置がわずかにずれる現象', '月の満ち欠けによって明るさが変わる現象', '季節によって見える星座が変わる現象'], correct: 0, explanation: '年周視差は地球の公転によって近い恒星の見える方向がずれる現象で、地球が公転している証拠であり、恒星までの距離を測る手がかりにもなります。', references: [] },
  { id: 'Q-057', fieldId: 'observation', target: 'advanced', text: '金環日食が起きるのは、月がどのような状態のときでしょう？', choices: ['地球に近く、見かけの大きさが太陽より大きいとき', '地球から遠く、見かけの大きさが太陽より小さいとき', '満月のとき'], correct: 1, explanation: '月が地球から遠く見かけが太陽より小さいと、太陽を隠しきれず周りがリング状に見える金環日食になります。', references: [ref.koyomi] },
  { id: 'Q-058', fieldId: 'observation', target: 'expert', text: '天球上の天体の位置を、地球の赤道を基準に表す座標で使うものはどれでしょう？', choices: ['方位と高度', '赤経と赤緯', '黄経と黄緯'], correct: 1, explanation: '赤道座標では赤経と赤緯で天体の位置を表します。方位と高度は地平座標、黄経と黄緯は黄道座標で使います。', references: [] },
  { id: 'Q-059', fieldId: 'observation', target: 'expert', text: '惑星の「逆行」とはどのような現象でしょう？', choices: ['惑星の公転の向きが実際に逆になる現象', '惑星の自転が一時的に止まる現象', '地球との位置関係で、星空の中を惑星がふだんと逆向きに動いて見える現象'], correct: 2, explanation: '逆行は、地球が外側の惑星を追い越すときなどに見かけ上起こる現象で、惑星の公転が実際に逆になるわけではありません。', references: [] },
  { id: 'Q-060', fieldId: 'observation', target: 'expert', text: '天体観測でいう「シーイング」とは何の程度を表すでしょう？', choices: ['大気の揺らぎによる星像の乱れ', '空の暗さ', '望遠鏡の倍率'], correct: 0, explanation: 'シーイングは大気の揺らぎによって星の像がにじんだり揺れたりする程度を表します。空の暗さとは別の指標です。', references: [] },

  // 宇宙のしくみ
  { id: 'Q-061', fieldId: 'physics', target: 'beginner', text: 'ほぼ真空の宇宙空間で、音は伝わるでしょうか？', choices: ['地上より速く伝わる', 'ほとんど伝わらない', '地上と同じように伝わる'], correct: 1, explanation: '音は空気などの物質の振動で伝わるため、物質がほとんどない宇宙空間ではほぼ伝わりません。', references: [] },
  { id: 'Q-062', fieldId: 'physics', target: 'beginner', text: '光の速さは、およそ秒速何kmでしょう？', choices: ['約300km', '約3万km', '約30万km'], correct: 2, explanation: '真空中の光の速さは秒速約30万km（正確には299,792.458km）です。', references: [] },
  { id: 'Q-063', fieldId: 'physics', target: 'beginner', text: '月面での重力の大きさは、地球のおよそ何分の1でしょう？', choices: ['約6分の1', '約2分の1', '約100分の1'], correct: 0, explanation: '月の表面の重力は地球の約6分の1です。', references: [ref.nasaSolar] },
  { id: 'Q-064', fieldId: 'physics', target: 'beginner', text: '「ビッグバン」は何を説明する考え方でしょう？', choices: ['太陽が誕生したしくみ', '宇宙が高温・高密度の状態から膨張してきたこと', '恒星が最後に爆発するしくみ'], correct: 1, explanation: 'ビッグバン理論は、宇宙が非常に高温・高密度の状態から膨張して現在の姿になったとする考え方です。', references: [] },
  { id: 'Q-065', fieldId: 'physics', target: 'beginner', text: '太陽の光が地球に届くまでにかかる時間は、およそどれくらいでしょう？', choices: ['約8秒', '約8分', '約8時間'], correct: 1, explanation: '太陽と地球の距離は約1億5,000万kmなので、光は約8分20秒で地球に届きます。', references: [] },
  { id: 'Q-066', fieldId: 'physics', target: 'intermediate', text: '国際宇宙ステーション（ISS）の中で物がふわふわ浮く主な理由はどれでしょう？', choices: ['宇宙には重力がまったくないから', '船内に空気がないから', 'ISSと中の物が一緒に地球へ向かって落ち続けている（自由落下）から'], correct: 2, explanation: 'ISSの高度でも地上の約9割の重力がはたらいています。ISSと中の物が一緒に自由落下しているため、無重量状態になります。', references: [ref.jaxaHuman] },
  { id: 'Q-067', fieldId: 'physics', target: 'intermediate', text: '宇宙の年齢として、現在の標準的な推定値に最も近いものはどれでしょう？', choices: ['約138億年', '約46億年', '約1億年'], correct: 0, explanation: '宇宙マイクロ波背景放射などの観測から、宇宙の年齢は約138億年と推定されています。約46億年は太陽系の年齢です。', references: [ref.esa] },
  { id: 'Q-068', fieldId: 'physics', target: 'intermediate', text: '太陽系の年齢（約46億年）は、主に何を調べて推定されているでしょう？', choices: ['海の塩分の濃さ', '隕石の放射性年代測定', '太陽の色の変化'], correct: 1, explanation: '隕石に含まれる放射性元素の崩壊を利用した年代測定から、太陽系の年齢は約46億年と推定されています。', references: [] },
  { id: 'Q-069', fieldId: 'physics', target: 'intermediate', text: 'ブラックホールの「事象の地平面」とは何でしょう？', choices: ['ブラックホールの表面にある固い地面', '周りを回るガスの円盤', 'その内側からは光も外へ出てこられない境界'], correct: 2, explanation: '事象の地平面より内側に入ると、光でさえ外へ出てくることができません。', references: [] },
  { id: 'Q-070', fieldId: 'physics', target: 'advanced', text: '遠くにある銀河ほど速く遠ざかっていることを表す法則はどれでしょう？', choices: ['ハッブル＝ルメートルの法則', 'ケプラーの第三法則', 'フックの法則'], correct: 0, explanation: '銀河が遠ざかる速さは距離に比例するという関係で、宇宙膨張の証拠とされます。2018年に国際天文学連合が「ハッブル＝ルメートルの法則」と呼ぶことを推奨しました。', references: [ref.iau] },
  { id: 'Q-071', fieldId: 'physics', target: 'advanced', text: '「宇宙マイクロ波背景放射」とは何でしょう？', choices: ['太陽から届く電波', '宇宙誕生から約38万年後に放たれた光の名残', '地球の大気が出す熱'], correct: 1, explanation: '宇宙誕生から約38万年後、宇宙が晴れ上がったときに放たれた光が、宇宙膨張で引き延ばされてマイクロ波として全天から届いています。', references: [ref.esa] },
  { id: 'Q-072', fieldId: 'physics', target: 'advanced', text: '2015年に重力波を初めて直接検出した観測施設はどれでしょう？', choices: ['すばる望遠鏡', 'ALMA望遠鏡', 'LIGO'], correct: 2, explanation: 'アメリカのLIGOが2015年9月、ブラックホール同士の合体による重力波を初めて直接検出しました。', references: [] },
  { id: 'Q-073', fieldId: 'physics', target: 'expert', text: 'ケプラーの第三法則では、惑星の公転周期の2乗は何に比例するとされているでしょう？', choices: ['軌道長半径の2乗', '軌道長半径の3乗', '惑星の質量'], correct: 1, explanation: 'ケプラーの第三法則は「公転周期の2乗は軌道長半径の3乗に比例する」というものです。', references: [] },
  { id: 'Q-074', fieldId: 'physics', target: 'expert', text: '宇宙の膨張が加速している原因と考えられている、正体不明のものは何と呼ばれているでしょう？', choices: ['ダークマター', '反物質', 'ダークエネルギー'], correct: 2, explanation: '宇宙の加速膨張を引き起こしていると考えられている未知の要素はダークエネルギーと呼ばれます。ダークマターは重力で物質を引き寄せる見えない物質です。', references: [] },
  { id: 'Q-075', fieldId: 'physics', target: 'expert', text: '鉄より重い元素の多くが作られる過程として知られているものはどれでしょう？', choices: ['中性子捕獲反応（s過程・r過程）', '恒星中心部での水素の核融合', '惑星表面での化学反応'], correct: 0, explanation: '鉄より重い元素の多くは、原子核が中性子を取り込む中性子捕獲反応で作られます。r過程は中性子星合体などで起こると考えられています。', references: [] },

  // 宇宙と暮らし
  { id: 'Q-076', fieldId: 'life', target: 'beginner', text: '国際宇宙ステーション（ISS）にある日本の実験棟の名前はどれでしょう？', choices: ['こうのとり', 'きぼう', 'みちびき'], correct: 1, explanation: '「きぼう」はISSに取り付けられている日本の実験棟です。', references: [ref.jaxaHuman] },
  { id: 'Q-077', fieldId: 'life', target: 'beginner', text: '天気予報などに使われている日本の気象衛星はどれでしょう？', choices: ['ひまわり', 'はやぶさ', 'あかつき'], correct: 0, explanation: '気象衛星「ひまわり」は静止軌道から雲や大気のようすを観測しています。', references: [] },
  { id: 'Q-078', fieldId: 'life', target: 'beginner', text: 'カーナビやスマートフォンが現在地を知るために使っているしくみはどれでしょう？', choices: ['気象レーダー', '光ファイバー通信', '衛星測位システム（GPSなど）'], correct: 2, explanation: '複数の測位衛星からの電波を受信し、届くまでの時間の差から現在地を計算しています。', references: [] },
  { id: 'Q-079', fieldId: 'life', target: 'beginner', text: '国際宇宙ステーション（ISS）が地球を1周するのにかかる時間は、およそどれくらいでしょう？', choices: ['約90分', '約24時間', '約1週間'], correct: 0, explanation: 'ISSは秒速約7.7kmで飛行しており、約90分で地球を1周します。', references: [ref.jaxaHuman] },
  { id: 'Q-080', fieldId: 'life', target: 'beginner', text: '日本人として初めて宇宙へ行った人物は誰でしょう？', choices: ['毛利衛', '向井千秋', '秋山豊寛'], correct: 2, explanation: '1990年、ジャーナリストの秋山豊寛さんがソ連の宇宙ステーション「ミール」に滞在し、日本人初の宇宙飛行者となりました。', references: [] },
  { id: 'Q-081', fieldId: 'life', target: 'intermediate', text: 'ISSへ物資を運んだ日本の無人補給機はどれでしょう？', choices: ['こうのとり（HTV）', 'きぼう', 'だいち'], correct: 0, explanation: '宇宙ステーション補給機「こうのとり」（HTV）は2009年から2020年までISSへ物資を運びました。', references: [ref.jaxaHuman] },
  { id: 'Q-082', fieldId: 'life', target: 'intermediate', text: '日本の衛星測位システム「みちびき」の主な目的はどれでしょう？', choices: ['天気を観測する', 'GPSを補完・補強し、位置情報の精度を高める', '小惑星を探査する'], correct: 1, explanation: '「みちびき」は日本付近の上空に長く滞在する軌道などを使い、GPSを補って位置情報の精度と安定性を高めます。', references: [] },
  { id: 'Q-083', fieldId: 'life', target: 'intermediate', text: 'ISSが飛行している高度は、およそどれくらいでしょう？', choices: ['約400km', '約4,000km', '約36,000km'], correct: 0, explanation: 'ISSは地上から約400kmの高さを飛行しています。', references: [ref.jaxaHuman] },
  { id: 'Q-084', fieldId: 'life', target: 'intermediate', text: '静止衛星が回っている軌道の高度は、およそどれくらいでしょう？', choices: ['約400km', '約36,000km', '約384,000km'], correct: 1, explanation: '静止軌道は赤道上空の約36,000kmにあります。約384,000kmは地球から月までの平均距離です。', references: [] },
  { id: 'Q-085', fieldId: 'life', target: 'advanced', text: '宇宙飛行士が長期滞在するときに注意が必要とされる体の変化はどれでしょう？', choices: ['身長が大きく縮む', '視力が急に良くなる', '骨量や筋力が低下する'], correct: 2, explanation: '重力の負荷が少ない環境では骨量や筋力が低下しやすいため、ISSでは毎日運動が行われています。', references: [ref.jaxaHuman] },
  { id: 'Q-086', fieldId: 'life', target: 'advanced', text: '地球を回る人工衛星が地上に落ちてこない理由として正しいものはどれでしょう？', choices: ['宇宙には重力がないから', '地球に向かって落ちながらも、横向きに十分な速さで進んでいるから', 'エンジンで常に浮かび続けているから'], correct: 1, explanation: '人工衛星は重力で地球に引かれ落ち続けていますが、横向きの速さが十分にあるため、地面に届かずに回り続けます。', references: [] },
  { id: 'Q-087', fieldId: 'life', target: 'advanced', text: '「スペースデブリ（宇宙ごみ）」が問題とされる主な理由はどれでしょう？', choices: ['高速で飛んでいるため、小さな破片でも衛星やISSに大きな損傷を与えうるから', '毎日大量に地上へ落ちてくるから', '強い電波を出して通信を妨害するから'], correct: 0, explanation: '地球周回軌道のデブリは秒速数kmで飛んでいるため、小さなものでも衝突すると大きな被害を生みます。', references: [ref.jaxa] },
  { id: 'Q-088', fieldId: 'life', target: 'expert', text: 'ISSの船内で呼吸に使う酸素を作る主な方法はどれでしょう？', choices: ['植物の光合成だけで作る', '水を電気分解して作る', '地球から運んだ酸素ボンベだけに頼る'], correct: 1, explanation: 'ISSでは主に水を電気分解して酸素を作っています。補給によって運ばれる酸素もあります。', references: [] },
  { id: 'Q-089', fieldId: 'life', target: 'expert', text: '高度約400kmを回るISSの速さは、およそどれくらいでしょう？', choices: ['秒速約0.8km', '秒速約7.7km', '秒速約77km'], correct: 1, explanation: 'ISSは秒速約7.7km（時速約2万8,000km）で地球を回っています。', references: [ref.jaxaHuman] },
  { id: 'Q-090', fieldId: 'life', target: 'expert', text: '静止衛星が地上から止まって見える理由として正しいものはどれでしょう？', choices: ['宇宙空間で静止しているから', '地球の磁場に固定されているから', '赤道上空を地球の自転と同じ向き・同じ周期で回っているから'], correct: 2, explanation: '静止衛星は赤道上空約36,000kmを地球の自転と同じ周期・向きで回るため、地上からは止まっているように見えます。', references: [] },
]

/** 版修正の例：Q-021 は v1 の正解設定を訂正した v2 が現行版 */
const correctedQuestion: QuestionContent = {
  id: 'Q-021',
  fieldId: 'stars',
  snsAccuracy: 0.44,
  current: {
    versionId: 'Q-021-v2',
    text: '太陽系から最も近い恒星系はどれでしょう？',
    choices: [
      { id: 'a', text: 'シリウス' },
      { id: 'b', text: 'ケンタウルス座アルファ星系' },
      { id: 'c', text: 'ベテルギウス' },
    ],
    correctChoiceId: 'b',
    explanation:
      'ケンタウルス座アルファ星系が太陽系に最も近い恒星系で、そのうちプロキシマ・ケンタウリまでは約4.2光年です。シリウスは約8.6光年の距離にあります。',
    references: [ref.nasa],
  },
  previousVersions: [
    {
      versionId: 'Q-021-v1',
      text: '太陽系から最も近い恒星系はどれでしょう？',
      choices: [
        { id: 'a', text: 'シリウス' },
        { id: 'b', text: 'ケンタウルス座アルファ星系' },
        { id: 'c', text: 'ベテルギウス' },
      ],
      correctChoiceId: 'a',
      explanation: 'シリウスは全天で最も明るい恒星です。',
      references: [],
    },
  ],
}

function hash(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

const accuracyRange: Record<QuestionDifficulty, [number, number]> = {
  beginner: [0.56, 0.86],
  intermediate: [0.32, 0.49],
  advanced: [0.12, 0.29],
  expert: [0.03, 0.09],
}

export const questionContents: QuestionContent[] = [
  ...seeds.map<QuestionContent>((s) => ({
    id: s.id,
    fieldId: s.fieldId,
    snsAccuracy: s.id === 'Q-018' ? undefined : Math.round((accuracyRange[s.target][0] + hash(`${s.id}sns`) * 0.25) * 100) / 100,
    current: {
      versionId: `${s.id}-v1`,
      text: s.text,
      choices: s.choices.map((text, i) => ({ id: choiceIds[i], text })),
      correctChoiceId: choiceIds[s.correct],
      explanation: s.explanation,
      references: s.references ?? [],
    },
  })),
  correctedQuestion,
].sort((a, b) => a.id.localeCompare(b.id))

const targetById = new Map(seeds.map((s) => [s.id, s.target]))

/** 境界確認用の統計（ルールと整合させた固定値） */
const boundaryStats: Record<string, Omit<QuestionStats, 'versionId'>> = {
  // 基本9回答＋復習多数 → まだ初級（SNS正答率を表示）。あと1件で自動判定
  'Q-005': { basicAnswerCount: 9, basicCorrectCount: 1, reviewAnswerCount: 42, reviewCorrectCount: 30 },
  // 10回答・50% → 中級（50%は「超」ではない）
  'Q-007': { basicAnswerCount: 10, basicCorrectCount: 5, reviewAnswerCount: 0, reviewCorrectCount: 0, judgedDifficulty: 'intermediate', judgedAtCount: 10 },
  // 100回答・30% → 上級
  'Q-013': { basicAnswerCount: 100, basicCorrectCount: 30, reviewAnswerCount: 4, reviewCorrectCount: 2, judgedDifficulty: 'advanced', judgedAtCount: 100 },
  // 100回答・10% → 専門家
  'Q-014': { basicAnswerCount: 100, basicCorrectCount: 10, reviewAnswerCount: 3, reviewCorrectCount: 1, judgedDifficulty: 'expert', judgedAtCount: 100 },
  // 回答0・SNS正答率なし → 未集計
  'Q-018': { basicAnswerCount: 0, basicCorrectCount: 0, reviewAnswerCount: 0, reviewCorrectCount: 0 },
  // 回答0・SNS正答率あり
  'Q-019': { basicAnswerCount: 0, basicCorrectCount: 0, reviewAnswerCount: 0, reviewCorrectCount: 0 },
  // 版修正後：新版3件のみ → 旧版の正答率・難易度を継承
  'Q-021': { basicAnswerCount: 3, basicCorrectCount: 2, reviewAnswerCount: 0, reviewCorrectCount: 0, inherited: { accuracy: 0.41, difficulty: 'intermediate' } },
}

export function createSeedStats(): Record<string, QuestionStats> {
  const result: Record<string, QuestionStats> = {}
  for (const content of questionContents) {
    const versionId = content.current.versionId
    const boundary = boundaryStats[content.id]
    if (boundary) {
      result[content.id] = { versionId, ...boundary }
      continue
    }
    const target = targetById.get(content.id) ?? 'beginner'
    const [min, max] = accuracyRange[target]
    const count = 20 + Math.floor(hash(`${content.id}count`) * 240)
    const accuracy = min + hash(`${content.id}acc`) * (max - min)
    const correct = Math.round(count * accuracy)
    const reviewCount = Math.floor(hash(`${content.id}rev`) * 30)
    result[content.id] = {
      versionId,
      basicAnswerCount: count,
      basicCorrectCount: correct,
      reviewAnswerCount: reviewCount,
      reviewCorrectCount: Math.round(reviewCount * Math.min(0.95, accuracy + 0.2)),
      judgedDifficulty: target,
      judgedAtCount: count,
    }
  }
  return result
}

const contentById = new Map(questionContents.map((q) => [q.id, q]))
const versionById = new Map<string, { content: QuestionContent; version: QuestionContent['current'] }>()
for (const content of questionContents) {
  versionById.set(content.current.versionId, { content, version: content.current })
  for (const v of content.previousVersions ?? []) versionById.set(v.versionId, { content, version: v })
}

export function getContent(id: string) {
  return contentById.get(id)
}

export function getVersion(versionId: string) {
  return versionById.get(versionId)
}

export function fieldName(id: string) {
  return fields.find((f) => f.id === id)?.name ?? id
}
