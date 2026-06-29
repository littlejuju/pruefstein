// biz-feasibility 深评模板 —— Workflow 工具用。
// 用法：先 Edit 注入本次的【硬约束 / 目标市场 / 创始人资产 / 已验证方向】到 CONFIG，
// 再用 Workflow({scriptPath: ".../feasibility-workflow.js"}) 跑（或把内容内联给 Workflow）。
// 它会：brainstorm ≥N 方案 → 逐方案 8 维对抗打分 + 母级死因逃逸裁决 → loop-until-dry → 首席综合。
// 跑完由主循环整合、判断角度是否穷尽、产出完整报告并归档。

export const meta = {
  name: 'biz-feasibility-eval',
  description: 'Brainstorm + adversarially score business-model proposals against the founder toolbox, loop until exhausted, synthesize a feasibility verdict',
  phases: [
    { title: 'Brainstorm R1' }, { title: 'Score R1' },
    { title: 'Brainstorm R2' }, { title: 'Score R2' },
    { title: 'Synthesis' },
  ],
}

// ===== 每次评估前改这里 =====
const CONFIG = {
  direction: '【填：要评估的方向，如 "社交 × side-project showcase 平台"】',
  hard_constraints: '【填：每个方案必须同时满足的硬约束，如 1.能平台化非agency 2.含社交层 3.含showcase层】',
  market: '【填：主市场，如 Singapore（主张更大市场须论证冷启动）】',
  founder_assets: '【填：创始人不对称优势，如 行业关系/落地能力/语言/AI·data 技能】',
  validated_alt: '【填：创始人已验证 WTP>0 的对照方向，作为相对吸引力的基准；无则填 "全职薪资"】',
  r1_count: 8, // 第一轮方案数
  r2_count: 5, // 后续每轮
  max_rounds: 3,
}

const FRAMEWORK = `
背景：为创始人评估方向「${CONFIG.direction}」的商业可行性。主市场默认 ${CONFIG.market}。创始人资产：${CONFIG.founder_assets}。对照已验证方向：${CONFIG.validated_alt}。
硬约束（每个 proposal 必须同时满足）：${CONFIG.hard_constraints}

【必须套用的判据（创始人工具箱 04）】
- 营收公式：Revenue = base × 付费转化 × AOV × take% × 频次 × lifetime − CAC；WTP/take 是主变量。
- 存量供给 vs 新供给：供给方"今天没你也在营业"=轻；要逼其开始营业=重（小市场=供给 wish，LinkedIn Career Advice 招专家死在此）。
- 三大母级死因：①去中介/跳单（撮合促成双方跳单 take→0，最普遍）②新供给陷阱 ③引擎装错位置（对展示/连接/内容/学习直接收费）。
- 铁律1：引擎只能装在"才华可读→雇主/VC/交易"旁。铁律2：收入必须挂"持续高频行为"，不能挂"一次性撮合"。
- 频次-密度-WTP 死锁：低频引擎要靠供给密度堆规模，小市场存量供给薄 → 要密度则 WTP→0、要 WTP 则撞 TAM 天花板。结构性，换角度消不掉。
- 公共品：免费层必须被补贴，问①谁补贴②留存引擎（习惯/网络锁定/积累价值）。
- 数据三逻辑：专家策展/传感器被动尾气/镜子还本人；好数据=高频被动尾气+专有+结构化+新鲜+合规+采集不改变行为。
- wish-market-fit 陷阱：需求暖响+实付 WTP≈0=最危险，别误判 PMF。
- 已知墓地：Lunchclub/Clubhouse/BeReal、read.cv/ProductHunt、在行/分答、Vaniday、Buildspace。
- 已知强敌：GitHub/Vercel/Replit、LinkedIn/Glints/NodeFlair、Antler/EF、Upwork/Toptal/Fiverr、Substack/Gumroad、Acquire.com/Flippa。
`

const PROPOSAL_SCHEMA = { type:'object', properties:{ proposals:{ type:'array', items:{ type:'object', properties:{
  name:{type:'string'}, one_liner:{type:'string'}, social_or_network_layer:{type:'string'}, showcase_or_supply_layer:{type:'string'},
  platform_mechanic:{type:'string'},
  how_it_escapes_mother_deaths:{type:'string', description:'具体如何逃出去中介/新供给/引擎装错位置三大死因——正面回答，空泛会被打死'},
  supply_existing_or_new:{type:'string'}, money_engine:{type:'string'}, who_pays:{type:'string'},
  retention_engine:{type:'string'}, cold_start_plan:{type:'string'}, differentiation_vs_incumbents:{type:'string'}, primary_risk:{type:'string'},
}, required:['name','one_liner','platform_mechanic','how_it_escapes_mother_deaths','supply_existing_or_new','money_engine','who_pays','retention_engine','cold_start_plan','primary_risk'] } } }, required:['proposals'] }

const FEAS_SCHEMA = { type:'object', properties:{
  proposal_name:{type:'string'},
  scores:{ type:'object', properties:{
    supply_existing_vs_new:{type:'number',description:'1-5,5=纯收割存量'}, frequency_retention:{type:'number'}, engine_strength:{type:'number'},
    platformizability:{type:'number'}, defensibility:{type:'number'}, disintermediation_resistance:{type:'number'}, cold_start_ease:{type:'number'}, wishmarket_safety:{type:'number'},
  }, required:['supply_existing_vs_new','frequency_retention','engine_strength','platformizability','defensibility','disintermediation_resistance','cold_start_ease','wishmarket_safety'] },
  total_score:{type:'number'},
  escapes_mother_deaths_verdict:{type:'string',description:'逐一裁决去中介/新供给/引擎位置三死因真逃出几个,搬家≠消除要点破'},
  unit_economics:{type:'string'}, kill_criteria_triggered:{type:'array',items:{type:'string'}}, rww:{type:'string'},
  what_would_have_to_be_true:{type:'array',items:{type:'string'}}, top_risks:{type:'array',items:{type:'string'}},
  verdict:{type:'string',description:'KILL/WEAK/PROMISING；PROMISING 须 total≥30 且三死因真逃≥2 且无致命 kill'},
}, required:['proposal_name','scores','total_score','escapes_mother_deaths_verdict','unit_economics','rww','verdict','what_would_have_to_be_true','top_risks'] }

const SEEN = [], allScored = []
let round = 0, promisingLast = 1
while (round < CONFIG.max_rounds) {
  round++
  const count = round === 1 ? CONFIG.r1_count : CONFIG.r2_count
  phase(`Brainstorm R${round}`)
  const brain = await agent(`${FRAMEWORK}\n\n你是资深平台战略 brainstorm 专家。生成 ${count} 个互不相同、满足全部硬约束的方案，每个用不同赚钱引擎。how_it_escapes_mother_deaths 是重点，须正面具体。扎根市场现实、可证伪、禁纯 agency。${round>1?`\n已出现过(须机制全新)：${SEEN.join('；')}\n若只剩换皮/不可行，在 one_liner 标注"[空间趋于穷尽]"。`:''}\n只返回结构化 proposals。`,
    { schema: PROPOSAL_SCHEMA, label:`brainstorm-r${round}`, phase:`Brainstorm R${round}` })
  const fresh = ((brain&&brain.proposals)||[]).filter(p=>p&&p.name&&!SEEN.some(s=>s.toLowerCase()===p.name.toLowerCase()))
  fresh.forEach(p=>SEEN.push(p.name))
  log(`R${round}: 新方案 ${fresh.length}`)
  phase(`Score R${round}`)
  const scored = (await parallel(fresh.map(p=>()=>
    agent(`${FRAMEWORK}\n\n你是冷峻可行性分析师，默认怀疑、kill-criteria 思维。严格打分裁决，escapes_mother_deaths_verdict 逐一裁决三死因、点破搬家话术。PROMISING 标准严。\n方案：\n${JSON.stringify(p,null,2)}\n只返回结构化裁决。`,
      { schema: FEAS_SCHEMA, label:`score:${p.name}`, phase:`Score R${round}` }).then(f=>({proposal:p,feas:f}))
  ))).filter(Boolean)
  allScored.push(...scored)
  const promising = scored.filter(s=>s.feas&&s.feas.verdict==='PROMISING').length
  log(`R${round}: PROMISING ${promising}`)
  if (round>=2 && promising===0 && promisingLast===0) { log('连续两轮无 PROMISING → 空间趋于穷尽，停止'); break }
  promisingLast = promising
}

phase('Synthesis')
const compact = allScored.map(s=>({ name:s.proposal.name, one_liner:s.proposal.one_liner, engine:s.proposal.money_engine,
  total:s.feas&&s.feas.total_score, verdict:s.feas&&s.feas.verdict, escape:s.feas&&s.feas.escapes_mother_deaths_verdict,
  scores:s.feas&&s.feas.scores, kills:s.feas&&s.feas.kill_criteria_triggered, wwhtbt:s.feas&&s.feas.what_would_have_to_be_true, risks:s.feas&&s.feas.top_risks }))
const synth = await agent(`${FRAMEWORK}\n\n你是首席战略，给创始人做最终 review。下面是 ${allScored.length} 个方案打分汇总：\n${JSON.stringify(compact,null,2)}\n\n写完整可行性分析(中文 markdown)：1.BLUF 整体有无可行非-agency 平台形态(敢下 KILL) 2.排名表 3.Top PROMISING 深析(引擎为何成立/wwhtbt/最便宜证伪测试+kill criteria) 4.被 KILL 共因 5.横切死因(呼应工具箱) 6.对创始人最终建议+与 ${CONFIG.validated_alt} 的相对吸引力 7.角度是否穷尽。犀利、不灌水。`,
  { label:'synthesis', phase:'Synthesis' })
return { count: allScored.length, ranking: compact.sort((a,b)=>(b.total||0)-(a.total||0)), synthesis: synth }
