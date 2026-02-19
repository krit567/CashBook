<script setup>
import { ref } from 'vue'
import { auth, db } from '../firebase' 
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth' // 🌟 นำเข้า signOut มาเพื่อเตะออก
import { doc, setDoc } from 'firebase/firestore' 
import { useAuthStore } from '../stores/auth' 
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('') 

const register = async () => {
  if (password.value !== confirmPassword.value) {
    alert("❌ รหัสผ่านทั้งสองช่องไม่ตรงกันครับ")
    return 
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user

    // 🌟 1. สร้างประวัติ และแปะป้าย 'pending' (รออนุมัติ)
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role: 'user',        
      status: 'pending', // 🛑 สำคัญมาก: บอกว่าคนนี้ยังไม่ได้รับอนุญาต
      createdAt: new Date()
    })
    
    // 🌟 2. เตะออกทันที! (เพราะ Firebase จะล็อกอินให้แอบเนียนๆ หลังสมัครเสร็จ)
    await signOut(auth)
    authStore.clearUser()
    
    alert("🎉 สมัครสมาชิกสำเร็จ! กรุณารอ Admin อนุมัติบัญชีก่อนเข้าใช้งานนะครับ")
    router.push('/') // วาร์ปกลับไปหน้า Login
    
  } catch (error) {
    alert("❌ เกิดข้อผิดพลาด: " + error.message)
  }
}
</script>

<template>
  <div>
    <h1>สร้างบัญชีใหม่ (Register)</h1>
    
    <form @submit.prevent="register">
      <div>
        <p>อีเมล:</p>
        <input type="email" v-model="email" required />
      </div>
      
      <div>
        <p>รหัสผ่าน (6 ตัวอักษรขึ้นไป):</p>
        <input type="password" v-model="password" required />
      </div>
      
      <div>
        <p>ยืนยันรหัสผ่านอีกครั้ง:</p>
        <input type="password" v-model="confirmPassword" required />
      </div>
      
      <br>
      <button type="submit">สมัครสมาชิก</button>
    </form>

    <p>
      มีบัญชีอยู่แล้วใช่ไหม? 
      <RouterLink to="/">กลับไปหน้าเข้าสู่ระบบ</RouterLink>
    </p>
  </div>
</template>