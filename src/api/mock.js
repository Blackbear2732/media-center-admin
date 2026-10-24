/* ========== 中心信息 ========== */
export const centerInfo = {
    name: '山西农业大学青年融媒体中心',
    desc: '山西农业大学青年融媒体中心成立于2013年，是学校对外宣传的重要窗口。中心现设有综合部、网宣部、新闻部、设计部、摄制部、影音部6个部门，以运营“山西农业大学团委“微信公众号和视频号为核心，全方位聚焦校园动态，及时跟进学校重大发展成果、宣传优秀师生典型。通过有力的新闻宣传和独特的视角，致力于传播农大声音、讲述农大故事、弘扬农大精神，生动展示师生积极向上的精神风貌，彰显学校深厚的文化底蕴。'
}

// 部门基础数据（与前端 dict.js 中的 DEPT_MAP 严格对应）
export const departments = [
    { id: 101, name: '综合部', intro: '负责沟通协调，承上启下我们将策划组织各类活动...', modules: ['checkin', 'dashboardUpload'], photos: [] },
    { id: 102, name: '网宣部', intro: '脑洞大开，创意无限在公众号大放异彩...', modules: ['article'], photos: [] },
    { id: 103, name: '影音部', intro: '负责音视频剪辑、后期包装与成片交付...', modules: ['video'], photos: [] },
    { id: 104, name: '摄制部', intro: '从日常生活到大型演出每一个快门的按下...', modules: ['device', 'raw'], photos: [] },
    { id: 105, name: '新闻部', intro: '让我们用镜头、声音编织故事...', modules: ['news'], photos: [] },
    { id: 106, name: '设计部', intro: '在这里，你可以发挥你的创意天赋...', modules: ['design'], photos: [] }
]

// 角色：0-部员, 1-部长, 2-主任；部门直接用 deptId
export const accounts = [
    {
        role: 0, deptId: 105, token: 'mock-member', label: '部员',
        user: { id: 1017, studentNo: '20250404306', name: '徐钰婷', nickname: '钰婷', deptId: 105, role: 0, college: '资源环境学院', className: '资环2503', grade: '2025级', phone: '18442808818', email: 'xuyuting@example.com', title: '部员', gender: '女', politicalStatus: '共青团员', status: 1 }
    },
    {
        role: 2, deptId: 100, token: 'mock-director', label: '中心主任',
        user: { id: 1001, studentNo: '20231614308', name: '张钧益', nickname: '钧益', deptId: 100, role: 2, college: '—', className: '—', grade: '2023级', phone: '13800000003', email: 'wang@example.com', title: '中心主任', gender: '男', politicalStatus: '中共党员', status: 1 }
    },
    {
        role: 1, deptId: 101, token: 'mock-zh', label: '部长',
        user: { id: 1002, studentNo: '2024010001', name: '赵景磊', deptId: 101, role: 1, title: '综合部部长', phone: '13800001001', gender: '男', college: '动物科学学院', className: '动科2403', grade: '2024级', email: 'zh@example.com', status: 1 }
    },
    {
        role: 1, deptId: 102, token: 'mock-wx', label: '部长',
        user: { id: 1003, studentNo: '2024010008', name: '刘怡昕', deptId: 102, role: 1, title: '网宣部部长', phone: '13800001008', gender: '女', college: '食品科学与工程学院', className: '营养2401', grade: '2024级', email: 'wx@example.com', status: 1 }
    },
    {
        role: 1, deptId: 103, token: 'mock-yy', label: '部长',
        user: { id: 1004, studentNo: '2024010003', name: '梁嘉怡', deptId: 103, role: 1, title: '影音部部长', phone: '13800001003', gender: '女', college: '软件学院', className: '软件2411', grade: '2024级', email: 'yy@example.com', status: 1 }
    },
    {
        role: 1, deptId: 104, token: 'mock-sz', label: '部长',
        user: { id: 1005, studentNo: '2024010011', name: '何文静', deptId: 104, role: 1, title: '摄制部部长', phone: '13800001011', gender: '女', college: '园艺学院', className: '园艺2406z', grade: '2024级', email: 'sz@example.com', status: 1 }
    },
    {
        role: 1, deptId: 105, token: 'mock-xw', label: '部长',
        user: { id: 1006, studentNo: '2024010006', name: '张洋', deptId: 105, role: 1, title: '新闻部部长', phone: '13800001006', gender: '男', college: '软件学院', className: '软件2406', grade: '2024级', email: 'xw@example.com', status: 1 }
    },
    {
        role: 1, deptId: 106, token: 'mock-sj', label: '部长',
        user: { id: 1007, studentNo: '2024010014', name: '李翔', deptId: 106, role: 1, title: '设计部部长', phone: '13800001014', gender: '男', college: '园艺学院', className: '视设2401', grade: '2024级', email: 'sj@example.com', status: 1 }
    }
]

// 按 角色 + 部门 查找演示账号（兼容旧的快速登录 / mock 内部使用）
export function findAccount(role, deptId) {
    const r = Number(role) || 0
    if (r === 1) {
        return accounts.find(a => a.role === 1 && a.deptId === Number(deptId)) || accounts.find(a => a.role === 1)
    }
    return accounts.find(a => a.role === r) || accounts[0]
}

// 账号密码登录（Mock 模式）：学号 / 姓名 / 若依账号均可，统一密码 123456
export function findAccountByUsername(username, password) {
    const name = String(username || '').trim()
    const pwd = String(password || '')
    if (!name || pwd !== '123456') return null
    // 与真实后端保持一致的账号别名
    const aliases = { admin: '20231614308', '2023000001': '20231614308', zhangsan: '20250404306' }
    const accountNo = aliases[name] || name
    return accounts.find(a =>
        a.user.studentNo === accountNo ||
        a.user.name === name ||
        a.user.userName === name
    ) || null
}

export function currentUser() {
    const userStr = localStorage.getItem('user')
    if (userStr) {
        try { return JSON.parse(userStr) } catch (e) {}
    }
    return findAccount(localStorage.getItem('role'), localStorage.getItem('adminDept'))?.user || accounts[0].user
}

export function currentRole() { return Number(localStorage.getItem('role') || 0) }

// 当前操作视角部门：主任默认全中心（100），部长/部员默认自己部门
export function currentDeptId() {
    const adminDept = localStorage.getItem('adminDept')
    if (adminDept !== null && adminDept !== '') return Number(adminDept)
    return Number(currentUser().deptId) || 100
}

/* ========== 完整成员名单 ========== */
// 映射工具，把中文部门转成数字 ID
const getDeptId = (deptName) => {
    const map = { '全中心': 100, '综合部': 101, '网宣部': 102, '影音部': 103, '摄制部': 104, '新闻部': 105, '设计部': 106 }
    return map[deptName] || 100
}

const rawMemberData = [
    // --- 部长名单 (15人) ---
    { n: '赵景磊', d: '综合部', c: '动物科学学院', cl: '动科2403', t: '部长', p: '13800001001', g: '男' },
    { n: '刘乃僡', d: '综合部', c: '软件学院', cl: '软件2420', t: '部长', p: '13800001002', g: '女' },
    { n: '闫佳慧', d: '影音部', c: '软件学院', cl: '软件2411', t: '部长', p: '13800001003', g: '女' },
    { n: '梁嘉怡', d: '影音部', c: '动物医学学院', cl: '动医2404', t: '部长', p: '13800001004', g: '女' },
    { n: '张茜', d: '影音部', c: '食品科学与工程学院', cl: '食用菌2401', t: '部长', p: '13800001005', g: '女' },
    { n: '张洋', d: '新闻部', c: '软件学院', cl: '软件2406', t: '部长', p: '13800001006', g: '男' },
    { n: '高瑜骏', d: '新闻部', c: '生命科学学院', cl: '中药2404', t: '部长', p: '13800001007', g: '男' },
    { n: '刘怡昕', d: '网宣部', c: '食品科学与工程学院', cl: '营养2401', t: '部长', p: '13800001008', g: '女' },
    { n: '李小雪', d: '网宣部', c: '农业经济管理学院', cl: '物流2402', t: '部长', p: '13800001009', g: '女' },
    { n: '崔文甲', d: '网宣部', c: '公共管理学院', cl: '公管2402', t: '部长', p: '13800001010', g: '男' },
    { n: '何文静', d: '摄制部', c: '园艺学院', cl: '园艺2406z', t: '部长', p: '13800001011', g: '女' },
    { n: '贾梓轩', d: '摄制部', c: '农业经济管理学院', cl: '物流管理2402', t: '部长', p: '13800001012', g: '男' },
    { n: '刘尚东', d: '摄制部', c: '软件学院', cl: '软件2406', t: '部长', p: '13800001013', g: '男' },
    { n: '李翔', d: '设计部', c: '园艺学院', cl: '视设2401', t: '部长', p: '13800001014', g: '男' },
    { n: '邢梓棋', d: '设计部', c: '软件学院', cl: '软件2414', t: '部长', p: '13800001015', g: '女' },

    // --- 综合部部员 (32人) ---
    { n: '贺颂莹', d: '综合部', c: '资源环境学院', cl: '资环2503', t: '部员', p: '17536302752', g: '女' },
    { n: '刘楷俊', d: '综合部', c: '植物保护学院', cl: '生药2501', t: '部员', p: '', g: '男' },
    { n: '栗子涵', d: '综合部', c: '园艺学院', cl: '视设2502', t: '部员', p: '13546512013', g: '女' },
    { n: '钟阳丽', d: '综合部', c: '园艺学院', cl: '视设2502', t: '部员', p: '18442805885', g: '女' },
    { n: '贾志卉茹', d: '综合部', c: '园艺学院', cl: '视设2501', t: '部员', p: '18636859456', g: '女' },
    { n: '郜晏', d: '综合部', c: '园艺学院', cl: '视设2501', t: '部员', p: '18504992622', g: '女' },
    { n: '王丽璇', d: '综合部', c: '园艺学院', cl: '设施2502', t: '部员', p: '18442806070', g: '女' },
    { n: '沈佳欢', d: '综合部', c: '园艺学院', cl: '设施2502', t: '部员', p: '18442829165', g: '女' },
    { n: '孙家圆', d: '综合部', c: '园艺学院', cl: '设施2502', t: '部员', p: '15513673077', g: '女' },
    { n: '李贞娴', d: '综合部', c: '信息科学与工程学院', cl: '网络2501', t: '部员', p: '15582438990', g: '女' },
    { n: '张鑫睿', d: '综合部', c: '信息科学与工程学院', cl: '物联2502', t: '部员', p: '15283632051', g: '女' },
    { n: '吕博微', d: '综合部', c: '信息科学与工程学院', cl: '物联2502', t: '部员', p: '15035995025', g: '女' },
    { n: '张晴', d: '综合部', c: '食品科学与工程学院', cl: '食用菌2502', t: '部员', p: '18535464824', g: '女' },
    { n: '郭亚宇', d: '综合部', c: '生命科学学院', cl: '中药2503', t: '部员', p: '17534973635', g: '女' },
    { n: '杨佳雪', d: '综合部', c: '生命科学学院', cl: '中药2503', t: '部员', p: '18442806639', g: '女' },
    { n: '丁育栋', d: '综合部', c: '生命科学学院', cl: '生科2503', t: '部员', p: '13453569886', g: '男' },
    { n: '梁鑫雨', d: '综合部', c: '生命科学学院', cl: '生信2501', t: '部员', p: '15035648884', g: '女' },
    { n: '陈泽阳', d: '综合部', c: '生命科学学院', cl: '生科2503', t: '部员', p: '15311800702', g: '男' },
    { n: '张璞', d: '综合部', c: '软件学院', cl: '软件2514', t: '部员', p: '', g: '女' },
    { n: '张迎晨', d: '综合部', c: '软件学院', cl: '软件2512', t: '部员', p: '13044411299', g: '男' },
    { n: '常嘉雯', d: '综合部', c: '农业工程学院', cl: '农电2501', t: '部员', p: '18613561078', g: '女' },
    { n: '张少烜', d: '综合部', c: '农业工程学院', cl: '农机2501', t: '部员', p: '15834210677', g: '男' },
    { n: '李琳娜', d: '综合部', c: '农学院', cl: '农学2505', t: '部员', p: '17536305869', g: '女' },
    { n: '郝元禹', d: '综合部', c: '农学院', cl: '农学2505', t: '部员', p: '17536307926', g: '女' },
    { n: '卢林凤', d: '综合部', c: '农学院', cl: '农学2504', t: '部员', p: '15931733686', g: '女' },
    { n: '魏雨锐', d: '综合部', c: '农学院', cl: '农学2507', t: '部员', p: '15235580684', g: '女' },
    { n: '李佳恩', d: '综合部', c: '公共管理学院', cl: '行管2501', t: '部员', p: '19582121788', g: '女' },
    { n: '李奕菲', d: '综合部', c: '动物医学学院', cl: '动医2503', t: '部员', p: '18964205060', g: '女' },
    { n: '王意茜', d: '综合部', c: '动物医学学院', cl: '动医2503', t: '部员', p: '13513606081', g: '女' },
    { n: '韩凯', d: '综合部', c: '动物科学学院', cl: '动科2503', t: '部员', p: '18535873739', g: '男' },
    { n: '刘语墨', d: '综合部', c: '动物科学学院', cl: '动科2503', t: '部员', p: '17536300903', g: '女' },
    { n: '梁浩帆', d: '综合部', c: '动物科学学院', cl: '动科2506', t: '部员', p: '18442833688', g: '男' },

    // --- 影音部部员 (23人) ---
    { n: '侯艾彤', d: '影音部', c: '资源环境学院', cl: '土管2501', t: '部员', p: '15582434932', g: '女' },
    { n: '宋雨宣', d: '影音部', c: '植物保护学院', cl: '植保2506', t: '部员', p: '15582438063', g: '女' },
    { n: '张馨艺', d: '影音部', c: '植物保护学院', cl: '植保2506', t: '部员', p: '17835818683', g: '女' },
    { n: '王思彤', d: '影音部', c: '植物保护学院', cl: '植保2501', t: '部员', p: '13599793200', g: '女' },
    { n: '张淑媛', d: '影音部', c: '信息科学与工程学院', cl: '电子2503', t: '部员', p: '13191096588', g: '女' },
    { n: '王佳怡', d: '影音部', c: '信息科学与工程学院', cl: '电子2503', t: '部员', p: '13072987973', g: '女' },
    { n: '赵黎科', d: '影音部', c: '食品科学与工程学院', cl: '食用菌2502', t: '部员', p: '15866108807', g: '男' },
    { n: '马恺悦', d: '影音部', c: '食品科学与工程学院', cl: '营养2501', t: '部员', p: '13353584944', g: '女' },
    { n: '王一然', d: '影音部', c: '食品科学与工程学院', cl: '食用菌2502', t: '部员', p: '18734610703', g: '女' },
    { n: '陈宣任', d: '影音部', c: '食品科学与工程学院', cl: '食用菌2502', t: '部员', p: '17836390188', g: '男' },
    { n: '邓可妮', d: '影音部', c: '食品科学与工程学院', cl: '食用菌2502', t: '部员', p: '18975451130', g: '女' },
    { n: '李晓乐', d: '影音部', c: '生命科学学院', cl: '生信2503班', t: '部员', p: '18536946637', g: '女' },
    { n: '宋可欣', d: '影音部', c: '生命科学学院', cl: '生信2501', t: '部员', p: '18835504710', g: '女' },
    { n: '李珂', d: '影音部', c: '软件学院', cl: '软件2520班', t: '部员', p: '13393490778', g: '女' },
    { n: '张策', d: '影音部', c: '软件学院', cl: '软件2510班', t: '部员', p: '19503428121', g: '男' },
    { n: '张娜', d: '影音部', c: '农业工程学院', cl: '农智2501', t: '部员', p: '18536900694', g: '女' },
    { n: '白佳鑫', d: '影音部', c: '农学院', cl: '种子2502', t: '部员', p: '17535840518', g: '女' },
    { n: '孙若涵', d: '影音部', c: '林学院', cl: '林学2504', t: '部员', p: '18532235065', g: '女' },
    { n: '鲍子涵', d: '影音部', c: '基础部', cl: '计算2502', t: '部员', p: '15064249019', g: '女' },
    { n: '王露炀', d: '影音部', c: '动物科学学院', cl: '动科2507班', t: '部员', p: '19303497056', g: '女' },
    { n: '张艺菲', d: '影音部', c: '动物科学学院', cl: '动科2507班', t: '部员', p: '18435163400', g: '女' },
    { n: '张可一', d: '影音部', c: '动物科学学院', cl: '动科2502', t: '部员', p: '15534476262', g: '女' },
    { n: '温诗语', d: '影音部', c: '软件学院', cl: '软件2501班', t: '部员', p: '17636658813', g: '女' },

    // --- 新闻部部员 (25人) ---
    { n: '徐钰婷', d: '新闻部', c: '资源环境学院', cl: '资环2503', t: '部员', p: '18442808818', g: '女' },
    { n: '李润琪', d: '新闻部', c: '植物保护学院', cl: '植保2506', t: '部员', p: '18835670495', g: '女' },
    { n: '陈存灿', d: '新闻部', c: '食品科学与工程学院', cl: '葡萄2501班', t: '部员', p: '15536373159', g: '男' },
    { n: '王佳楠', d: '新闻部', c: '食品科学与工程学院', cl: '食安2502', t: '部员', p: '15513995120', g: '女' },
    { n: '吴宇亭', d: '新闻部', c: '软件学院', cl: '软件2510', t: '部员', p: '18235282608', g: '女' },
    { n: '赵敏', d: '新闻部', c: '软件学院', cl: '软件2515', t: '部员', p: '18334708185', g: '女' },
    { n: '谷晓萱', d: '新闻部', c: '软件学院', cl: '软件2515', t: '部员', p: '16274678999', g: '女' },
    { n: '程安娜', d: '新闻部', c: '软件学院', cl: '软件2516', t: '部员', p: '18135448377', g: '女' },
    { n: '刘雨钊', d: '新闻部', c: '软件学院', cl: '软件2516', t: '部员', p: '15303544487', g: '男' },
    { n: '曹文萍', d: '新闻部', c: '软件学院', cl: '软件2515', t: '部员', p: '18536900278', g: '女' },
    { n: '冯智博', d: '新闻部', c: '软件学院', cl: '软件2506', t: '部员', p: '18442834011', g: '女' },
    { n: '苗雨露', d: '新闻部', c: '软件学院', cl: '软件2502', t: '部员', p: '18536943149', g: '女' },
    { n: '袁乐乐', d: '新闻部', c: '农业经济管理学院', cl: '国贸2502', t: '部员', p: '13357370830', g: '女' },
    { n: '李中祺', d: '新闻部', c: '农业工程学院', cl: '电气2503', t: '部员', p: '18935236711', g: '女' },
    { n: '马清栗', d: '新闻部', c: '农学院', cl: '农学2508', t: '部员', p: '19834928211', g: '女' },
    { n: '靳艳辉', d: '新闻部', c: '林学院', cl: '园林2502', t: '部员', p: '13453541323', g: '女' },
    { n: '江奕', d: '新闻部', c: '公共管理学院', cl: '法学2502', t: '部员', p: '13211156820', g: '女' },
    { n: '张彤', d: '新闻部', c: '动物医学学院', cl: '动医2505', t: '部员', p: '16635406842', g: '女' },
    { n: '靳羽西', d: '新闻部', c: '动物医学学院', cl: '动医2503', t: '部员', p: '15513998826', g: '女' },
    { n: '王珮宇', d: '新闻部', c: '动物科学学院', cl: '动科2507', t: '部员', p: '19510331530', g: '女' },
    { n: '朱千慧', d: '新闻部', c: '城乡建设学院', cl: '城规2502', t: '部员', p: '15342394194', g: '女' },
    { n: '陈明增', d: '新闻部', c: '城乡建设学院', cl: '水利2501班', t: '部员', p: '13624999520', g: '男' },
    { n: '王馨诺', d: '新闻部', c: '草业学院', cl: '草业2501', t: '部员', p: '13108282399', g: '女' },
    { n: '刘满', d: '新闻部', c: '草业学院', cl: '草业2504', t: '部员', p: '18442835517', g: '女' },
    { n: '汪子淳', d: '新闻部', c: '林学院', cl: '水保2502', t: '部员', p: '18442806798', g: '男' },

    // --- 网宣部部员 (28人) ---
    { n: '刘钰珂', d: '网宣部', c: '园艺学院', cl: '园艺2503', t: '部员', p: '15383666935', g: '女' },
    { n: '徐子芯', d: '网宣部', c: '园艺学院', cl: '园艺2503', t: '部员', p: '15100929092', g: '女' },
    { n: '邱靖然', d: '网宣部', c: '园艺学院', cl: '园艺2503', t: '部员', p: '15734931704', g: '女' },
    { n: '高亚妮', d: '网宣部', c: '园艺学院', cl: '园艺2503', t: '部员', p: '18442806061', g: '女' },
    { n: '刘维镇', d: '网宣部', c: '信息科学与工程学院', cl: '物联2501', t: '部员', p: '17652943667', g: '男' },
    { n: '王晓雪', d: '网宣部', c: '信息科学与工程学院', cl: '电子2503', t: '部员', p: '18442833498', g: '女' },
    { n: '姜一凡', d: '网宣部', c: '食品科学与工程学院', cl: '食用菌250', t: '部员', p: '16678632231', g: '女' },
    { n: '孔艺蓉', d: '网宣部', c: '食品科学与工程学院', cl: '营养2501', t: '部员', p: '18442808724', g: '女' },
    { n: '高雨润', d: '网宣部', c: '食品科学与工程学院', cl: '营养2501', t: '部员', p: '15935840330', g: '女' },
    { n: '李昊哲', d: '网宣部', c: '食品科学与工程学院', cl: '食品2503', t: '部员', p: '19581916136', g: '男' },
    { n: '贾寒雪', d: '网宣部', c: '食品科学与工程学院', cl: '食品2502', t: '部员', p: '15222280650', g: '女' },
    { n: '郝晋一', d: '网宣部', c: '食品科学与工程学院', cl: '食品2502', t: '部员', p: '15735796531', g: '女' },
    { n: '张慧欣', d: '网宣部', c: '食品科学与工程学院', cl: '食品2502', t: '部员', p: '19581512071', g: '女' },
    { n: '宋晓乐', d: '网宣部', c: '食品科学与工程学院', cl: '食品2502', t: '部员', p: '19834976050', g: '女' },
    { n: '李文璇', d: '网宣部', c: '生命科学学院', cl: '生科2501', t: '部员', p: '18536900492', g: '女' },
    { n: '付鑫楠', d: '网宣部', c: '软件学院', cl: '数媒2502', t: '部员', p: '18536942809', g: '女' },
    { n: '王廷瑶', d: '网宣部', c: '软件学院', cl: '数媒2502', t: '部员', p: '15582437093', g: '女' },
    { n: '刘欢欢', d: '网宣部', c: '农业经济管理学院', cl: '发展2502', t: '部员', p: '13994846335', g: '女' },
    { n: '翟瑛璇', d: '网宣部', c: '农业工程学院', cl: '电气2503', t: '部员', p: '19735417246', g: '女' },
    { n: '武沁瑶', d: '网宣部', c: '林学院', cl: '林学2504', t: '部员', p: '18334681258', g: '女' },
    { n: '亓梦阳', d: '网宣部', c: '公共管理学院', cl: '法学2502', t: '部员', p: '18503457537', g: '女' },
    { n: '王乐乐', d: '网宣部', c: '公共管理学院', cl: '行管2502', t: '部员', p: '19335130128', g: '女' },
    { n: '陈明阳', d: '网宣部', c: '公共管理学院', cl: '治理2501', t: '部员', p: '18245375207', g: '男' },
    { n: '李子涵', d: '网宣部', c: '动物科学学院', cl: '动科2507', t: '部员', p: '15535705144', g: '女' },
    { n: '陈冬雪', d: '网宣部', c: '草业学院', cl: '草业2502', t: '部员', p: '18283259587', g: '女' },
    { n: '王春连', d: '网宣部', c: '草业学院', cl: '草业2503', t: '部员', p: '17536308385', g: '女' },
    { n: '彭帼研', d: '网宣部', c: '草业学院', cl: '草业2502', t: '部员', p: '19918952508', g: '女' },
    { n: '李紫凝', d: '网宣部', c: '草业学院', cl: '草业2502', t: '部员', p: '19581921426', g: '女' },

    // --- 摄制部部员 (49人) ---
    { n: '刘铂羽', d: '摄制部', c: '资源环境学院', cl: '土管2501', t: '部员', p: '13140515069', g: '女' },
    { n: '胡瑶璇', d: '摄制部', c: '资源环境学院', cl: '土管2501', t: '部员', p: '19062081736', g: '女' },
    { n: '卢波源', d: '摄制部', c: '资源环境学院', cl: '土工2502', t: '部员', p: '18534885009', g: '男' },
    { n: '麻敬怡', d: '摄制部', c: '资源环境学院', cl: '环科2501', t: '部员', p: '17536305629', g: '女' },
    { n: '牛宇轩', d: '摄制部', c: '植物保护学院', cl: '植保2503', t: '部员', p: '17536308665', g: '女' },
    { n: '孙晓月', d: '摄制部', c: '信息科学与工程学院', cl: '物联2502', t: '部员', p: '13920678038', g: '女' },
    { n: '贾友松', d: '摄制部', c: '信息科学与工程学院', cl: '计科2502', t: '部员', p: '', g: '男' },
    { n: '庞铖耀', d: '摄制部', c: '信息科学与工程学院', cl: '计科 2502', t: '部员', p: '17703522408', g: '男' },
    { n: '韩耀', d: '摄制部', c: '信息科学与工程学院', cl: '电子2501', t: '部员', p: '17835040905', g: '男' },
    { n: '尹嘉悦', d: '摄制部', c: '食品科学与工程学院', cl: '食用菌2501', t: '部员', p: '17870386638', g: '女' },
    { n: '石伊君', d: '摄制部', c: '食品科学与工程学院', cl: '食用菌2501', t: '部员', p: '13836690194', g: '女' },
    { n: '李思慧', d: '摄制部', c: '食品科学与工程学院', cl: '食品2502', t: '部员', p: '13593150679', g: '女' },
    { n: '张嘉勇', d: '摄制部', c: '食品科学与工程学院', cl: '食品2502', t: '部员', p: '18295748786', g: '男' },
    { n: '魏宇昕', d: '摄制部', c: '食品科学与工程学院', cl: '食品2502', t: '部员', p: '15582434439', g: '女' },
    { n: '彭越', d: '摄制部', c: '食品科学与工程学院', cl: '食品2502', t: '部员', p: '17335025267', g: '女' },
    { n: '赵宸欣', d: '摄制部', c: '食品科学与工程学院', cl: '食安2502', t: '部员', p: '15835400976', g: '女' },
    { n: '王欣怡', d: '摄制部', c: '食品科学与工程学院', cl: '食安2501', t: '部员', p: '13002210529', g: '女' },
    { n: '乔文馨', d: '摄制部', c: '生命科学学院', cl: '中药2501', t: '部员', p: '17536300115', g: '女' },
    { n: '成昀欣', d: '摄制部', c: '生命科学学院', cl: '中药2501', t: '部员', p: '13546388903', g: '女' },
    { n: '王晶鑫', d: '摄制部', c: '生命科学学院', cl: '生信2502', t: '部员', p: '13623646739', g: '女' },
    { n: '韩佳欣', d: '摄制部', c: '生命科学学院', cl: '生信2501', t: '部员', p: '16656128995', g: '女' },
    { n: '陈庆恩', d: '摄制部', c: '生命科学学院', cl: '生科2503', t: '部员', p: '15639743305', g: '男' },
    { n: '格茸央宗', d: '摄制部', c: '生命科学学院', cl: '生科2503', t: '部员', p: '15536350626', g: '女' },
    { n: '高利娜', d: '摄制部', c: '软件学院', cl: '软件2514', t: '部员', p: '13994358248', g: '女' },
    { n: '周鑫', d: '摄制部', c: '软件学院', cl: '软件2514', t: '部员', p: '18536949513', g: '女' },
    { n: '任荫征', d: '摄制部', c: '软件学院', cl: '智科2502', t: '部员', p: '17536302486', g: '男' },
    { n: '韩志扬', d: '摄制部', c: '软件学院', cl: '软件2515', t: '部员', p: '13753252098', g: '男' },
    { n: '郝晶', d: '摄制部', c: '软件学院', cl: '软件2502', t: '部员', p: '15582434926', g: '女' },
    { n: '赵鑫慧', d: '摄制部', c: '软件学院', cl: '软件2510', t: '部员', p: '15834102868', g: '女' },
    { n: '赵子玥', d: '摄制部', c: '软件学院', cl: '软件2502', t: '部员', p: '15803534231', g: '女' },
    { n: '高欣妍', d: '摄制部', c: '软件学院', cl: '软件2507', t: '部员', p: '18035156235', g: '女' },
    { n: '杨明远', d: '摄制部', c: '农业经济管理学院', cl: '物流2501', t: '部员', p: '19398779286', g: '男' },
    { n: '张可欣', d: '摄制部', c: '农业经济管理学院', cl: '物流2501', t: '部员', p: '13361364910', g: '女' },
    { n: '孟德奥', d: '摄制部', c: '农业经济管理学院', cl: '物流2501', t: '部员', p: '18335487782', g: '男' },
    { n: '高慧聪', d: '摄制部', c: '农业工程学院', cl: '车辆2401', t: '部员', p: '15804477236', g: '男' },
    { n: '杨笑', d: '摄制部', c: '农业工程学院', cl: '农智2501', t: '部员', p: '18442809674', g: '男' },
    { n: '肖莓', d: '摄制部', c: '农业工程学院', cl: '农智2501', t: '部员', p: '15582437163', g: '女' },
    { n: '武国庆', d: '摄制部', c: '农业工程学院', cl: '电气2502班', t: '部员', p: '18534275442', g: '男' },
    { n: '刘沛知', d: '摄制部', c: '农业工程学院', cl: '农电2501', t: '部员', p: '15582438780', g: '男' },
    { n: '靳晨妤', d: '摄制部', c: '农学院', cl: '农学2503', t: '部员', p: '17536302207', g: '女' },
    { n: '黎琳', d: '摄制部', c: '农学院', cl: '智农2501', t: '部员', p: '18259767304', g: '女' },
    { n: '陈思羽', d: '摄制部', c: '公共管理学院', cl: '法学2502', t: '部员', p: '15135650778', g: '女' },
    { n: '罗紫依', d: '摄制部', c: '动物医学学院', cl: '动医2504', t: '部员', p: '13363541877', g: '女' },
    { n: '陈诺', d: '摄制部', c: '动物医学学院', cl: '动检2501', t: '部员', p: '15195578040', g: '男' },
    { n: '郭展如', d: '摄制部', c: '动物医学学院', cl: '动医2505', t: '部员', p: '18442806360', g: '女' },
    { n: '任泽鑫', d: '摄制部', c: '动物科学学院', cl: '动科2502', t: '部员', p: '17536306921', g: '男' },
    { n: '袁昭仪', d: '摄制部', c: '城乡建设学院', cl: '城规 2502', t: '部员', p: '17537768677', g: '女' },
    { n: '王佳鑫', d: '摄制部', c: '草业学院', cl: '草业2501', t: '部员', p: '18535461418', g: '女' },
    { n: '张思雨', d: '摄制部', c: '草业学院', cl: '草业2504', t: '部员', p: '13008063048', g: '女' },

    // --- 设计部部员 (26人) ---
    { n: '王亚楠', d: '设计部', c: '园艺学院', cl: '视设2501', t: '部员', p: '18535400694', g: '女' },
    { n: '李梓凡', d: '设计部', c: '园艺学院', cl: '视设2501', t: '部员', p: '15364874909', g: '女' },
    { n: '李什瑾', d: '设计部', c: '园艺学院', cl: '视设2501', t: '部员', p: '13718937308', g: '女' },
    { n: '潘驿心', d: '设计部', c: '园艺学院', cl: '视设2501', t: '部员', p: '15698587571', g: '女' },
    { n: '郭玲孜', d: '设计部', c: '园艺学院', cl: '视设2501', t: '部员', p: '13610639342', g: '女' },
    { n: '郑宇哲', d: '设计部', c: '园艺学院', cl: '视设2501', t: '部员', p: '18834574385', g: '男' },
    { n: '郜晏', d: '设计部', c: '园艺学院', cl: '视设2501', t: '部员', p: '15124711622', g: '女' },
    { n: '张荣容', d: '设计部', c: '园艺学院', cl: '视设2501', t: '部员', p: '15296601581', g: '女' },
    { n: '李依桐', d: '设计部', c: '园艺学院', cl: '视设2502', t: '部员', p: '13033430372', g: '女' },
    { n: '李佳瑞', d: '设计部', c: '园艺学院', cl: '视设2502', t: '部员', p: '19504738981', g: '女' },
    { n: '孙苏心', d: '设计部', c: '园艺学院', cl: '视设2502', t: '部员', p: '15234158112', g: '女' },
    { n: '赵苒彤', d: '设计部', c: '园艺学院', cl: '园艺2504', t: '部员', p: '16635409463', g: '女' },
    { n: '樊子靖', d: '设计部', c: '信息科学与工程学院', cl: '网络2503', t: '部员', p: '15035510905', g: '女' },
    { n: '白婉彤', d: '设计部', c: '信息科学与工程学院', cl: '网络2503', t: '部员', p: '18442807656', g: '女' },
    { n: '魏宇昕', d: '设计部', c: '食品科学与工程学院', cl: '食品2502', t: '部员', p: '15582434439', g: '女' },
    { n: '刘蕙铭', d: '设计部', c: '软件学院', cl: '软件2508', t: '部员', p: '17535419972', g: '女' },
    { n: '王奕韬', d: '设计部', c: '软件学院', cl: '软件2509', t: '部员', p: '15513698316', g: '男' },
    { n: '柴靖彭', d: '设计部', c: '软件学院', cl: '软件2518', t: '部员', p: '19035163655', g: '男' },
    { n: '梁泽乾', d: '设计部', c: '软件学院', cl: '软件2518', t: '部员', p: '18535464648', g: '男' },
    { n: '王钰欣', d: '设计部', c: '软件学院', cl: '数媒2501', t: '部员', p: '18536149111', g: '女' },
    { n: '李和彤', d: '设计部', c: '软件学院', cl: '数媒2501', t: '部员', p: '17536306519', g: '女' },
    { n: '赵雅欣', d: '设计部', c: '软件学院', cl: '数媒2501', t: '部员', p: '15834022908', g: '女' },
    { n: '王廷瑶', d: '设计部', c: '软件学院', cl: '数媒2502', t: '部员', p: '15582437093', g: '女' },
    { n: '付鑫楠', d: '设计部', c: '软件学院', cl: '数媒2502', t: '部员', p: '18536942809', g: '女' },
    { n: '任晓丹', d: '设计部', c: '软件学院', cl: '数媒2502', t: '部员', p: '17536300146', g: '女' },
    { n: '余智祥', d: '设计部', c: '农业经济管理学院', cl: '经管2501', t: '部员', p: '15698356256', g: '男' }
]

// 自动生成完整成员对象（包含 deptId）
export const members = rawMemberData.map((m, i) => {
    const isMinister = m.t === '部长'
    return {
        id: 1000 + i,
        studentNo: isMinister ? `2024${String(i).padStart(6, '0')}` : `2025${String(i).padStart(6, '0')}`,
        name: m.n,
        deptId: getDeptId(m.d), // 👈 数字部门 ID
        college: m.c,
        className: m.cl,
        grade: isMinister ? '2024级' : '2025级',
        role: isMinister ? 1 : 0, // 👈 0部员 1部长
        title: isMinister ? `${m.d}部长` : '部员',
        phone: m.p || '',
        email: `user${i}@example.com`,
        status: 1, // 👈 1-在岗 0-停用
        politicalStatus: isMinister && i % 2 === 0 ? '中共党员' : (isMinister || i % 3 === 0 ? '共青团员' : '群众'),
        gender: m.g
    }
})

/* ========== 任务 ========== */
// 设备统一使用 equipmentId（对应 biz_task_equipment.equipment_id），名称在页面里由 deviceList 映射
export const tasks = [
    {
        id: 1, title: '2024 秋季运动会开幕式报道', status: 0, startTime: '2024-11-05 08:00', endTime: '2024-11-05 12:00', // 👈 0筹备
        location: '学校田径场', themeTag: '体育比赛', tags: ['运动会','新闻报道'],
        deptIds: [105, 104], relatedDeptIds: [102], equipmentIds: [2, 9], // 👈 部门 deptIds / 设备 equipmentIds
        description: '负责开幕式全程图文与视频素材采集，当天 18:00 前完成初稿。',
        participants: [
            { name: '徐钰婷', deptId: 105, extraScore: 2, scoreReason: '开幕式现场报道及时，文笔优秀' },
            { name: '李润琪', deptId: 105 },
            { name: '刘铂羽', deptId: 104, extraScore: 1.5, scoreReason: '扛机器一整天，非常辛苦' },
            { name: '胡瑶璇', deptId: 104 }
        ],
        signups: [
            { name: '陈存灿', deptId: 105, status: 0 }, // 👈 0待确认(待审核)
            { name: '王亚楠', deptId: 106, status: 0 }
        ]
    },
    {
        id: 2, title: '校园文化节宣传片拍摄', status: 1, startTime: '2024-11-08 09:00', endTime: '2024-11-10 18:00', // 👈 1进行中
        location: '大学生活动中心', themeTag: '舞蹈比赛', tags: ['宣传片','文化节'],
        deptIds: [104], relatedDeptIds: [103, 106], equipmentIds: [6, 8],
        description: '拍摄 3 分钟校园文化节宣传片，摄制部负责拍摄，影音部负责后期。',
        participants: [
            { name: '卢波源', deptId: 104, extraScore: 3, scoreReason: '航拍画面极其震撼' },
            { name: '麻敬怡', deptId: 104 },
            { name: '闫佳慧', deptId: 103, extraScore: 1, scoreReason: '后期剪辑效率高' },
            { name: '王亚楠', deptId: 106 }
        ],
        signups: []
    },
    {
        id: 3, title: '新生入学教育专题稿件', status: 2, startTime: '2024-09-10 09:00', endTime: '2024-09-12 18:00', // 👈 2已结束
        location: '线上', themeTag: '迎新', tags: ['迎新','专题'],
        deptIds: [105], relatedDeptIds: [], equipmentIds: [],
        description: '入学教育专题稿件撰写与审核。',
        participants: [
            { name: '徐钰婷', deptId: 105, extraScore: 1, scoreReason: '稿件质量高' },
            { name: '赵敏', deptId: 105 }
        ],
        signups: []
    },
    {
        id: 4, title: '校庆 70 周年海报设计', status: 1, startTime: '2024-11-01 09:00', endTime: '2024-11-15 18:00',
        location: '设计部工作室', themeTag: '节日类', tags: ['校庆','海报'],
        deptIds: [106], relatedDeptIds: [102], equipmentIds: [1],
        description: '主视觉海报 3 版方案。',
        participants: [
            { name: '王亚楠', deptId: 106, extraScore: 2, scoreReason: '主视觉方案被领导直接采用' },
            { name: '李梓凡', deptId: 106 },
            { name: '刘钰珂', deptId: 102 }
        ],
        signups: []
    },
    {
        id: 5, title: '“青春之声”主题直播', status: 0, startTime: '2024-11-20 19:00', endTime: '2024-11-20 21:00',
        location: '融媒体演播厅', themeTag: '文艺活动', tags: ['直播'],
        deptIds: [104, 103], relatedDeptIds: [102], equipmentIds: [10, 21],
        description: '校园歌手大赛决赛直播。',
        participants: [
            { name: '侯艾彤', deptId: 103 },
            { name: '张策', deptId: 103 },
            { name: '刘钰珂', deptId: 102, extraScore: 1, scoreReason: '直播间互动控场极佳' }
        ],
        signups: []
    },
    {
        id: 6, title: '校党委理论学习中心组会议', status: 2, startTime: '2024-10-20 14:00', endTime: '2024-10-20 17:00',
        location: '行政楼 302', themeTag: '会议', tags: ['会议','新闻稿'],
        deptIds: [105], relatedDeptIds: [], equipmentIds: [],
        description: '会议类新闻稿，需记录主要领导。',
        participants: [
            { name: '李润琪', deptId: 105, extraScore: 0.5, scoreReason: '会议记录详细完整' }
        ],
        signups: []
    }
]

/* ========== 素材 ========== */
// type：1新闻稿 2推文图片 3海报设计图 4视频素材 5视频成片 6原创推文（与 biz_material.type 一致）
export const materials = [
    { id: 1, title: '运动会开幕式新闻稿', type: 1, deptId: 105, author: '徐钰婷', // 👈 type 1新闻稿
        createdAt: '2024-11-05 13:20', leaderName: '李书记', themeTag: '体育比赛', taskId: 1,
        content: '11 月 5 日上午，我校 2024 年秋季运动会在田径场隆重开幕。校党委书记李书记出席开幕式并宣布运动会开幕。\n\n本次运动会共有来自 20 个学院的 1200 余名运动员参加 36 个项目的角逐。',
        netdiskUrl: 'https://pan.example.com/s/abc123', netdiskCode: 'x7k9', sharedDeptIds: [102], // 👈 共享部门
        versions: [
            { version: 'v3', updatedAt: '2024-11-05 13:20', size: '12KB', author: '徐钰婷' },
            { version: 'v2', updatedAt: '2024-11-05 12:10', size: '11KB', author: '徐钰婷' }
        ], extracts: [{ user: '刘钰珂', time: '2024-11-05 15:00' }] },
    { id: 2, title: '校园文化节宣传片成片', type: 5, deptId: 103, author: '闫佳慧', // 👈 type 5视频成片
        createdAt: '2024-11-10 18:30', leaderName: '', themeTag: '舞蹈比赛', taskId: 2,
        content: '', videoChannelUrl: 'https://channels.weixin.qq.com/xxx',
        netdiskUrl: 'https://pan.example.com/s/vid456', netdiskCode: 'b2m1', sharedDeptIds: [102],
        versions: [{ version: 'v2', updatedAt: '2024-11-10 18:30', size: '1.2GB', author: '闫佳慧' }], extracts: [] },
    { id: 3, title: '校庆 70 周年主视觉设计图', type: 3, deptId: 106, author: '李翔', // 👈 type 3海报设计图
        createdAt: '2024-11-08 10:00', leaderName: '', themeTag: '节日类', taskId: 4,
        content: '', netdiskUrl: 'https://pan.example.com/s/psd789', netdiskCode: 'q8w2', sharedDeptIds: [],
        versions: [{ version: 'v1', updatedAt: '2024-11-08 10:00', size: '320MB', author: '李翔' }], extracts: [] },
    { id: 4, title: '校党委理论学习中心组会议新闻稿', type: 1, deptId: 105, author: '李润琪',
        createdAt: '2024-10-20 18:00', leaderName: '李书记', themeTag: '会议', taskId: 6,
        content: '10 月 20 日下午，校党委理论学习中心组在行政楼 302 召开专题学习会，李书记主持会议并讲话。',
        netdiskUrl: 'https://pan.example.com/s/txt321', netdiskCode: 'z3n5', sharedDeptIds: [101],
        versions: [{ version: 'v1', updatedAt: '2024-10-20 18:00', size: '6KB', author: '李润琪' }], extracts: [] }
]

/* ========== 个人区 ========== */
// 打卡状态（0未打卡 1已打卡 2迟到 3缺勤）这里用于个人考勤正常/迟到
export const attendance = {
    rate: 92, total: 50, normal: 46, late: 2, absent: 2,
    records: [
        { id: 1, date: '2024-11-05', task: '运动会开幕式报道', status: 1, time: '08:02' }, // 1正常
        { id: 2, date: '2024-11-04', task: '部门例会', status: 2, time: '09:12' }, // 2迟到
        { id: 3, date: '2024-11-03', task: '校庆素材整理', status: 1, time: '08:55' },
        { id: 4, date: '2024-11-02', task: '宣传片拍摄', status: 3, time: '—' } // 3缺勤
    ]
}

// 会议状态（1已参加 0待参加）
export const meetings = [
    { id: 1, title: '融媒体中心月度例会', time: '2024-11-04 14:00', location: '中心会议室', host: '王主任', status: 1 },
    { id: 2, title: '运动会报道筹备会', time: '2024-11-03 10:00', location: '线上腾讯会议', host: '张洋', status: 1 },
    { id: 3, title: '校庆宣传方案评审会', time: '2024-11-15 15:00', location: '行政楼 302', host: '王主任', status: 0 }
]

// 设备申请状态（0待审核 1已通过 3使用中 4已归还）
export const myDevices = [
    { id: 1, name: '佳能 EOS R5 单反相机', applyTime: '2024-11-04 09:00', startTime: '2024-11-05 08:00', endTime: '2024-11-05 18:00', status: 4 },
    { id: 2, name: '大疆 Mavic 3 无人机', applyTime: '2024-11-07 15:00', startTime: '2024-11-08 09:00', endTime: '2024-11-10 18:00', status: 3 },
    { id: 3, name: '索尼 FX3 摄像机', applyTime: '2024-11-18 10:00', startTime: '2024-11-20 18:00', endTime: '2024-11-20 22:00', status: 0 }
]

export const messages = [
    { id: 1, title: '任务指派通知', content: '您已被指派参与「2024 秋季运动会开幕式报道」任务，请及时查看。', time: '2024-11-04 10:20', isRead: 0 },
    { id: 2, title: '素材传输完成', content: '「校园文化节宣传片」成片已由影音部上传，可前往任务详情查看。', time: '2024-11-10 18:35', isRead: 0 },
    { id: 3, title: '设备审核通过', content: '您申请的「大疆 Mavic 3 无人机」已审批通过，请按时领取。', time: '2024-11-07 16:00', isRead: 1 }
]

/* ========== 设备 ========== */
// 设备状态：0可用 1借出 2维修 3报废
export const deviceList = [
    { id: 1, code: 'SJ-001', name: '图形工作站', model: '联想 (i7-12700F/16G)', buyDate: '2025-03-01', status: 0, remark: '含显示器27寸、键鼠、HDMI线及转换器', stock: 1 },
    { id: 2, code: 'SJ-002', name: '佳能 R6 单反相机 - 1号', model: '佳能 EOS R6', buyDate: '2023-03-01', status: 1, remark: '含：RF24-105 普通镜头、电池及充电器', stock: 1 },
    { id: 3, code: 'SJ-003', name: '佳能 R6 单反相机 - 2号', model: '佳能 EOS R6', buyDate: '2023-03-01', status: 0, remark: '含：RF24-105 普通镜头、电池及充电器', stock: 1 },
    { id: 4, code: 'SJ-004', name: '佳能 R6 Mark II 单反 - 1号', model: '佳能 EOS R6 Mark II', buyDate: '2025-03-01', status: 0, remark: '含：普通镜头、备用电池', stock: 1 },
    { id: 5, code: 'SJ-005', name: '佳能 R6 Mark II 单反 - 2号', model: '佳能 EOS R6 Mark II', buyDate: '2025-03-01', status: 0, remark: '含：红圈镜头、备用电池', stock: 1 },
    { id: 6, code: 'SJ-006', name: '大疆 RS5 稳定器 - 1号', model: '大疆如影 RS5 专业套装', buyDate: '2025-03-01', status: 0, remark: '含：手提转接件、快装板、电池手柄', stock: 1 },
    { id: 7, code: 'SJ-007', name: '大疆 RS5 稳定器 - 2号', model: '大疆如影 RS5 专业套装', buyDate: '2025-03-01', status: 0, remark: '含：手提转接件、快装板、电池手柄', stock: 1 },
    { id: 8, code: 'SJ-008', name: '无人机', model: '大疆御4 Pro 畅飞套装', buyDate: '2025-03-01', status: 0, remark: '含：RC遥控*2，螺旋桨*4，电池*3，ND镜，256G卡', stock: 1 },
    { id: 9, code: 'SJ-009', name: '索尼摄像机', model: '索尼 Z150', buyDate: '2025-03-01', status: 0, remark: '含：国产电池*2，摄像机包，ECM-VG1麦克风', stock: 1 },
    { id: 10, code: 'SJ-010', name: '麦克风套装', model: '纽曼+MOMA', buyDate: '2025-03-01', status: 2, remark: '含：接收器，麦克风*4，监听器*3，防风球*2，收纳包*3', stock: 1 },
    { id: 11, code: 'SJ-011', name: '提词器', model: 'Besview', buyDate: '2025-03-01', status: 0, remark: '含：主体，升降云台，遮光罩，遥控器，支架，收纳包', stock: 1 },
    { id: 12, code: 'SJ-012', name: '三脚架 - 1号(大)', model: '通用型', buyDate: '2025-03-01', status: 0, remark: '含：快拆、收纳包', stock: 1 },
    { id: 13, code: 'SJ-013', name: '三脚架 - 2号(大)', model: '通用型', buyDate: '2025-03-01', status: 0, remark: '含：快拆、收纳包', stock: 1 },
    { id: 14, code: 'SJ-014', name: '三脚架 - 3号(小)', model: '通用型', buyDate: '2025-03-01', status: 0, remark: '含：快拆、收纳包', stock: 1 },
    { id: 15, code: 'SJ-015', name: '补光灯套装', model: 'CINEPEER+100W', buyDate: '2025-03-01', status: 0, remark: '含：补光灯棒*2，100w补光灯，柔光球罩，电池，适配器', stock: 1 },
    { id: 16, code: 'SJ-016', name: '反光板', model: '通用型', buyDate: '2025-03-01', status: 0, remark: '标准反光板', stock: 1 },
    { id: 17, code: 'SJ-017', name: '手持DV', model: '通用型', buyDate: '2025-03-01', status: 0, remark: 'DV套装', stock: 1 },
    { id: 18, code: 'SJ-018', name: '长焦镜头', model: '佳能 F2.8 70-200mm', buyDate: '2023-03-01', status: 0, remark: '含：遮光罩，镜头盖（红圈）', stock: 1 },
    { id: 19, code: 'SJ-019', name: '运动相机', model: '大疆 Action 5 Pro', buyDate: '2025-03-01', status: 0, remark: '含：主机，兔笼，快拆*2，手柄，电池仓，电池*3', stock: 1 },
    { id: 20, code: 'SJ-020', name: '内存卡', model: '雷克沙 128G', buyDate: '2025-03-01', status: 0, remark: '128G 高速内存卡', stock: 1 },
    { id: 21, code: 'SJ-021', name: '无线麦克风', model: '大疆麦克风套装', buyDate: '2025-03-01', status: 0, remark: '含：麦克风*2，充电仓，数据线*3，防风罩*2，接收器', stock: 1 },
    { id: 22, code: 'SJ-022', name: '闪光灯套装', model: '神牛', buyDate: '2025-03-01', status: 0, remark: '含：主灯及电池，收纳包，副闪光灯，充电器，微型底座', stock: 1 },
    { id: 23, code: 'SJ-023', name: '活动马甲', model: '融媒体中心专用', buyDate: '2025-03-01', status: 0, remark: '共15件', stock: 15 }
]

export const deviceNames = deviceList.map(d => d.name)

// 设备申请状态（0待审核 1已通过 3使用中）
export const deviceApplications = [
    { id: 1, applicant: '徐钰婷', deptId: 105, phone: '18442808818', device: '佳能 EOS R5 单反相机', startTime: '2024-11-05 08:00', endTime: '2024-11-05 18:00', purpose: '运动会开幕式拍摄', taskName: '2024 秋季运动会开幕式报道', status: 1, opinion: '同意，注意保管' },
    { id: 2, applicant: '刘钰珂', deptId: 102, phone: '15383666935', device: '大疆 Mavic 3 无人机', startTime: '2024-11-08 09:00', endTime: '2024-11-10 18:00', purpose: '校园航拍', taskName: '', status: 0, opinion: '' },
    { id: 3, applicant: '王亚楠', deptId: 106, phone: '18535400694', device: '索尼 FX3 摄像机', startTime: '2024-11-20 18:00', endTime: '2024-11-20 22:00', purpose: '直播摄像', taskName: '“青春之声”主题直播', status: 3, opinion: '' }
]

/* ========== 上传字段 ========== */
// 键为 deptId（101~106），与 `materialApi.uploadFields(deptId)` 对应
export const uploadFieldMap = {
    101: [
        { key: 'title', label: '材料名称', type: 'input', required: true },
        { key: 'content', label: '材料说明', type: 'textarea' },
        { key: 'netdiskUrl', label: '附件网盘链接', type: 'input' }
    ],
    102: [
        { key: 'title', label: '推文标题', type: 'input', required: true },
        { key: 'content', label: '推文正文', type: 'textarea', required: true },
        { key: 'platform', label: '发布平台', type: 'input' },
        { key: 'netdiskUrl', label: '配图网盘链接', type: 'input' }
    ],
    103: [
        { key: 'title', label: '作品名称', type: 'input', required: true },
        { key: 'netdiskUrl', label: '成品百度网盘链接', type: 'input', required: true },
        { key: 'netdiskCode', label: '提取码', type: 'input' },
        { key: 'videoChannelUrl', label: '视频号链接', type: 'input' },
        { key: 'duration', label: '视频时长', type: 'input' }
    ],
    104: [
        { key: 'title', label: '素材名称', type: 'input', required: true },
        { key: 'netdiskUrl', label: '原始素材网盘链接', type: 'input', required: true },
        { key: 'netdiskCode', label: '提取码', type: 'input' },
        { key: 'shootDate', label: '拍摄日期', type: 'input' }
    ],
    105: [
        { key: 'title', label: '稿件标题', type: 'input', required: true },
        { key: 'content', label: '新闻稿正文', type: 'textarea', required: true },
        { key: 'leaderName', label: '主要领导（会议类必填）', type: 'input' },
        { key: 'netdiskUrl', label: '配图网盘链接', type: 'input' }
    ],
    106: [
        { key: 'title', label: '作品名称', type: 'input', required: true },
        { key: 'netdiskUrl', label: '设计图网盘链接', type: 'input', required: true },
        { key: 'netdiskCode', label: '提取码', type: 'input' },
        { key: 'size', label: '文件大小', type: 'input' }
    ]
}

/* ========== 部门管理区 ========== */
export const deptOverview = {
    memberCount: 6, activeCount: 5, taskCount: 4, materialCount: 8, monthEvaluation: '待发起',
    todos: [
        { type: 'signup', text: '陈存灿 报名「2024 秋季运动会开幕式报道」，待确认', time: '2024-11-04 09:12' },
        { type: 'material', text: '「校园文化节宣传片」成片已上传，待部门归档', time: '2024-11-10 18:35' },
        { type: 'evaluation', text: '10 月部门考评尚未发起', time: '2024-11-01 00:00' }
    ],
    recentTasks: [
        { id: 1, title: '2024 秋季运动会开幕式报道', status: 0, startTime: '2024-11-05 08:00' },
        { id: 2, title: '校园文化节宣传片拍摄', status: 1, startTime: '2024-11-08 09:00' }
    ]
}

export const adminMeetings = [
    { id: 1, title: '融媒体中心全体部长例会', time: '2024-11-04 14:00', location: '中心会议室', host: '王主任', deptId: 100, records: [] },
    { id: 2, title: '新闻部 11 月第一次例会', time: '2024-11-04 14:00', location: '中心会议室', host: '张洋', deptId: 105, records: [] },
    { id: 3, title: '运动会报道筹备会', time: '2024-11-03 10:00', location: '线上腾讯会议', host: '张洋', deptId: 105, records: [] }
]

export const evaluationTemplates = {
    '新闻部': [
        { key: 'news', name: '撰写新闻稿', score: 1, type: 'auto' },
        { key: 'meeting', name: '会议到场', score: 1, type: 'auto' },
        { key: 'late', name: '会议迟到', score: 0.5, type: 'auto' },
        { key: 'task', name: '任务参与', score: 0.5, type: 'auto' },
        { key: 'extra', name: '临时加派', score: 1, type: 'manual' }
    ],
    '摄制部': [
        { key: 'shoot', name: '跟拍', score: 1, type: 'manual' },
        { key: 'cut', name: '剪视频', score: 1.5, type: 'manual' },
        { key: 'revise', name: '修改视频', score: 0.5, type: 'manual' },
        { key: 'publish', name: '发视频', score: 1, type: 'manual' },
        { key: 'other', name: '其他', score: 0.5, type: 'manual' }
    ]
}
export const defaultEvaluationTemplate = [
    { key: 'task', name: '任务参与', score: 0.5, type: 'auto' },
    { key: 'meeting', name: '会议到场', score: 1, type: 'auto' },
    { key: 'extra', name: '临时加派', score: 1, type: 'manual' }
]

// 考评记录（0不合格 1合格 2良好 3优秀）
export const evaluations = [
    {
        id: 1, month: '2024-11', deptId: 105, member: '徐钰婷',
        autoScore: 12.5, manualScore: 2, total: 14.5, level: 3, status: 1, createdAt: '2024-11-20 10:00',
        details: {
            checkinDays: 10, checkinScore: 5, taskScore: 5, meetingScore: 2.5,
            taskList: [
                { title: '2024 秋季运动会开幕式报道', score: 2 },
                { title: '新生入学教育专题稿件', score: 3 }
            ],
            meetingList: [
                { title: '新闻部 11 月第一次例会', score: 1 },
                { title: '运动会报道筹备会', score: 1.5 }
            ],
            extraNote: '开幕式新闻报道非常出色，额外加 2 分'
        }
    },
    {
        id: 2, month: '2024-11', deptId: 105, member: '李润琪',
        autoScore: 8, manualScore: 0, total: 8, level: 2, status: 1, createdAt: '2024-11-20 10:00',
        details: {
            checkinDays: 6, checkinScore: 3, taskScore: 3, meetingScore: 2,
            taskList: [{ title: '校党委理论学习中心组会议', score: 3 }],
            meetingList: [{ title: '新闻部 11 月第一次例会', score: 2 }],
            extraNote: ''
        }
    }
]

export const evaluationTemplate = [
    { key: 'checkin', name: '每日转发打卡', score: 0.5, type: 'auto', desc: '每打卡一次加 0.5 分' },
    { key: 'task', name: '参与任务', score: 1, type: 'auto', desc: '每参与一个任务加 1 分' },
    { key: 'meeting', name: '会议到场', score: 0.5, type: 'auto', desc: '到场加 0.5 分，迟到加 0.2 分' },
    { key: 'manual', name: '部长附加评分', score: 0, type: 'manual', desc: '根据日常表现手动打分' }
]

// 打卡记录（1已打卡 0未打卡）
export const checkinRecords = [
    { id: 1, date: '2026-05-20', deptId: 105, member: '徐钰婷', status: 1 },
    { id: 2, date: '2026-05-20', deptId: 105, member: '李润琪', status: 1 }
]

// 申诉状态：0待审批 1已通过 2已拒绝
export const checkinAppeals = [
    { id: 1, member: '李润琪', deptId: 105, date: '2024-11-05', reason: '当天已转发但系统未记录', status: 0, createdAt: '2024-11-06 09:00' },
    { id: 2, member: '王亚楠', deptId: 106, date: '2024-11-02', reason: '外出拍摄无法转发', status: 1, createdAt: '2024-11-03 10:00' }
]

export const checkinStats = [
    { deptId: 105, rate: 95, total: 20, normal: 19, absent: 1 },
    { deptId: 102, rate: 88, total: 20, normal: 17, absent: 3 },
    { deptId: 106, rate: 92, total: 20, normal: 18, absent: 2 },
    { deptId: 104, rate: 90, total: 20, normal: 18, absent: 2 },
    { deptId: 103, rate: 85, total: 20, normal: 17, absent: 3 },
    { deptId: 101, rate: 98, total: 20, normal: 19, absent: 1 }
]

export const dashboardData = {
    wx: {
        summary: { totalViews: 245000, totalLikes: 8500, totalOriginal: 12, totalCount: 142 },
        trend: [
            { month: '2026-01', views: 12000, likes: 400 }, { month: '2026-02', views: 15000, likes: 500 }, { month: '2026-03', views: 80000, likes: 2500 }, { month: '2026-04', views: 100000, likes: 3500 }, { month: '2026-05', views: 38000, likes: 1600 }
        ],
        list: [
            { id: 1, title: '纳新｜你的热爱，值得一个舞台', type: '原创', date: '2026-03-08', views: 9261, likes: 227, url: 'https://mp.weixin.qq.com/s/3pIMGijOnnvHwxhqkr5mww' },
            { id: 2, title: '丁香艺术团招新 丨 等你“艺” 起绽放', type: '社团活动', date: '2026-03-01', views: 6642, likes: 86, url: 'https://mp.weixin.qq.com/s/86ata_IwkM85sy8sHDFlXA' }
        ]
    },
    yy: {
        summary: { totalViews: 856000, totalLikes: 25000, totalVideos: 33, totalCount: 179 },
        trend: [
            { month: '2026-01', views: 89000, likes: 1800 }, { month: '2026-02', views: 75000, likes: 2100 }, { month: '2026-03', views: 120000, likes: 4000 }, { month: '2026-04', views: 190000, likes: 5000 }, { month: '2026-05', views: 382000, likes: 12100 }
        ],
        list: [
            { id: 1, title: '你好，新同学！', type: '迎新', date: '2025-09-11', views: 34044, likes: 300, url: 'https://channels.weixin.qq.com/xxx' },
            { id: 2, title: '执笔书梦 青春诗行', type: '毕业季', date: '2025-06-18', views: 31381, likes: 801, url: 'https://channels.weixin.qq.com/xxx' }
        ]
    }
}

export const announcements = [
    { id: 1, title: '关于 2024 年秋季运动会宣传工作的通知', author: '王主任', scope: 1, createdAt: '2024-11-01 09:00', content: '各相关部门：\n\n为做好秋季运动会宣传工作，请新闻部、摄制部提前做好人员安排与设备准备……' },
    { id: 2, title: '融媒体中心 10 月考评结果公示', author: '王主任', scope: 1, createdAt: '2024-11-02 15:00', content: '10 月考评结果已出，请各部门部长登录部门管理区查看详情。' }
]

export const deptProfiles = Object.fromEntries(
    departments.map(d => [d.id, {
        intro: d.intro, contact: '0354-6288xxx', logo: '', cover: '', photos: [],
        members: members.filter(m => m.deptId === d.id && m.status === 1).map(m => ({ name: m.name, title: m.title }))
    }])
)

/* ========== 筛选工具 ========== */
// 注意这里前端如果传参也会变成数字
export const filterTasks = ({ status } = {}) =>
    status === undefined || status === null || Number(status) === -1
        ? tasks
        : tasks.filter(t => Number(t.status) === Number(status))

export const filterMaterials = (p = {}) => materials.filter(m => {
    if (p.title && !m.title.includes(p.title)) return false
    if (p.content && !(m.content || '').includes(p.content)) return false
    if (p.deptId && Number(m.deptId) !== Number(p.deptId)) return false
    if (p.leaderName && m.leaderName !== p.leaderName) return false

    // createdAt 精确到分钟（YYYY-MM-DD HH:mm），筛选值只到日期，
    // 直接字符串比较会把当天素材误判为超出结束日期，因此统一按日期部分比较
    const createdDate = String(m.createdAt || '').slice(0, 10)
    const startDate = p.startTime ? String(p.startTime).slice(0, 10) : ''
    const endDate = p.endTime ? String(p.endTime).slice(0, 10) : ''
    if (startDate && createdDate < startDate) return false
    if (endDate && createdDate > endDate) return false
    return true
})

/* ========== 管理区菜单配置 ========== */
// 配置如果用数字作为键，前端匹配会更顺畅
export const baseAdminMenus = [
    { path: 'overview', label: '概览' }, { path: 'members', label: '成员管理' },
    { path: 'tasks', label: '任务参与' }, { path: 'meetings', label: '会议管理' },
    { path: 'evaluations', label: '考评管理' }, { path: 'materials', label: '本部门素材' },
    { path: 'announcements', label: '公告管理' }, { path: 'dept-profile', label: '部门介绍' }
]

export const specialAdminMenus = {
    101: [ // 综合部
        { path: 'checkins', label: '打卡管理' },
        { path: 'dashboard', label: '数据看板' }
    ],
    104: [ // 摄制部
        { path: 'devices', label: '设备管理' }
    ]
}

/* ========== 部门模块挂载（biz_dept_module） ========== */
// 键为 deptId，值为启用的 module_key 数组
export const deptModuleConfig = Object.fromEntries(
    departments.map(d => [d.id, [...d.modules]])
)

/* ========== 首页最新视频 ========== */
export const videos = [
    { id: 1, title: '你好，新同学！', duration: '03:12', cover: '' },
    { id: 2, title: '执笔书梦 青春诗行', duration: '04:05', cover: '' },
    { id: 3, title: '校运会精彩集锦', duration: '02:38', cover: '' },
    { id: 4, title: '融媒体中心纳新宣传片', duration: '01:56', cover: '' }
]

/* ========== 打卡管理授权 / 额外加分（演示数据，空即可） ========== */
export const evalEvents = []
export const checkinManagers = []
export const checkinManagerCandidates = []