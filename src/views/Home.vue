<script setup>
import { ref } from 'vue'
import { auth, db } from '../firebase' // 🌟 อย่าลืม import db
import { signInWithEmailAndPassword, signOut } from 'firebase/auth' // 🌟 นำเข้า signOut
import { doc, getDoc } from 'firebase/firestore' // 🌟 นำเข้าตัวอ่านฐานข้อมูล
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')

const login = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user

    // 🌟 1. วิ่งไปเปิดแฟ้มประวัติของคนนี้ใน Firestore
    const userDocRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userDocRef)

    // 🌟 2. เช็คว่ามีประวัติไหม และสถานะเป็น 'pending' หรือเปล่า?
    if (userSnap.exists() && userSnap.data().status === 'pending') {
      // ถ้ายังรออนุมัติอยู่ -> เตะออก!
      await signOut(auth)
      authStore.clearUser()
      alert("⏳ บัญชีของคุณอยู่ระหว่างรอ Admin อนุมัติครับ ยังเข้าใช้งานไม่ได้น้า")
      return // หยุดการทำงานแค่นี้ ไม่ให้เข้าเว็บ
    }
    
    // 🌟 3. ถ้าผ่านด่านมาได้ (เป็น admin หรือ user ที่ผ่านการอนุมัติแล้ว)
    authStore.setUser(user)
    alert("✅ ล็อกอินสำเร็จ!")
    router.push('/dashboard') 
    
  } catch (error) {
    alert("❌ รหัสผ่านผิด หรือไม่มีอีเมลนี้ในระบบครับ")
  }
}
</script>

<template>
  <div>
    <h1>เข้าสู่ระบบ (Login)</h1>
    
    <form @submit.prevent="login">
      <div>
        <p>อีเมล:</p>
        <input type="email" v-model="email" required />
      </div>
      <div>
        <p>รหัสผ่าน:</p>
        <input type="password" v-model="password" required />
      </div>
      
      <br>
      <button type="submit">ล็อกอิน</button>
    </form>

    <p>
      ยังไม่มีบัญชีใช่ไหม? 
      <RouterLink to="/register">สมัครสมาชิกที่นี่</RouterLink>
    </p>
  </div>
</template>