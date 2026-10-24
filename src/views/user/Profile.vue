<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header><b>基本信息</b></template>
          <el-form :model="form" label-width="90px">
            <el-form-item label="学号"><el-input v-model="form.studentNo" disabled /></el-form-item>
            <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="form.nickname" placeholder="可自定义，不填则显示姓名" />
            </el-form-item>
            <el-form-item label="学院"><el-input v-model="form.college" /></el-form-item>
            <el-form-item label="班级"><el-input v-model="form.className" /></el-form-item>
            <el-form-item label="电话"><el-input v-model="form.phone" placeholder="用于接收通知" /></el-form-item>
            <el-form-item label="邮箱" required>
              <el-input v-model="form.email" placeholder="必填，用于接收系统通知" />
              <div class="muted" style="margin-top:4px">邮箱为必填项，任务与会议通知将发送至此邮箱</div>
            </el-form-item>
            <el-form-item label="MeoW昵称">
              <el-input v-model="form.meowNick" placeholder="填写后在鸿蒙手机 MeoW 上接收系统通知" />
              <div class="muted" style="margin-top:4px">可选。在华为鸿蒙手机安装 MeoW 并注册昵称后填写，任务/会议/公告通知将同步推送到手机</div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="save">保存修改</el-button>
              <el-button @click="reset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header><b>账号安全</b></template>
          <el-form :model="pwd" label-width="90px">
            <el-form-item label="原密码"><el-input v-model="pwd.oldPassword" type="password" show-password /></el-form-item>
            <el-form-item label="新密码"><el-input v-model="pwd.newPassword" type="password" show-password /></el-form-item>
            <el-form-item label="确认密码"><el-input v-model="pwd.confirmPassword" type="password" show-password /></el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="pwdSaving" @click="changePwd">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api'
import { userStore } from '@/store/user'

const router = useRouter()
const form = reactive({ studentNo: '', name: '', nickname: '', college: '', className: '', phone: '', email: '', meowNick: '' })
const pwd = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const loading = ref(false), saving = ref(false), pwdSaving = ref(false)
let origin = {}

onMounted(async () => {
  loading.value = true
  try {
    const u = await userApi.profile()   // GET /api/user/profile
    Object.assign(form, u); origin = { ...u }
  } finally { loading.value = false }
})
function reset() { Object.assign(form, origin) }

async function save() {
  if (!form.email) return ElMessage.warning('邮箱为必填项')
  saving.value = true
  try {
    await userApi.updateProfile({ ...form })  // PUT /api/user/profile
    origin = { ...form }
    ElMessage.success('保存成功')
  } finally { saving.value = false }
}
async function changePwd() {
  if (!pwd.oldPassword || !pwd.newPassword) return ElMessage.warning('请填写完整')
  if (pwd.newPassword !== pwd.confirmPassword) return ElMessage.warning('两次输入的新密码不一致')
  pwdSaving.value = true
  try {
    await userApi.updatePassword({ ...pwd })  // PUT /api/user/password
    ElMessage.success('密码修改成功，请重新登录')
    userStore.logout()
    router.replace('/login')
  } finally { pwdSaving.value = false }
}
</script>