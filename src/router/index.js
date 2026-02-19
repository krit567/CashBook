import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Register from '@/views/Register.vue'
import Dashboard from '@/views/Dashboard.vue'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path:'/register',
      name: 'register',
      component: Register
    },
    { 
      path: '/dashboard', 
      name: 'dashboard', 
      component: Dashboard,
      meta: { requiresAuth: true }
    },
  ],
})

// ฟังก์ชันสั่งให้ยามไปถาม Firebase ว่า "ตอนนี้มีใครล็อกอินอยู่ไหม?"
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    }, reject)
  })
}

// ยามเฝ้าประตูดักจับทุกครั้งที่มีการเปลี่ยนหน้าเว็บ
router.beforeEach(async (to, from, next) => {
  // เช็คว่าหน้าที่กำลังจะไป มีป้าย requiresAuth ไหม
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth) {
    // ถ้ามีป้าย -> ให้ยามรอตรวจบัตรจาก Firebase ก่อน
    const user = await getCurrentUser()
    
    if (user) {
      next() // ถ้ามีคนล็อกอินอยู่ -> เปิดประตูให้ผ่าน!
    } else {
      alert('🛑 คุณไม่มีสิทธิ์เข้าหน้านี้ กรุณาล็อกอินก่อนครับ')
      next('/') // ถ้าไม่มีคนล็อกอิน -> เตะกลับหน้าแรก (Login)!
    }
  } else {
    // ถ้าหน้าอื่น (เช่น หน้า Login, Register) ไม่ต้องตรวจบัตร ปล่อยผ่านได้เลย
    next()
  }
})

export default router
