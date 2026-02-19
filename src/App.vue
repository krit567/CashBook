<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue' // 1. เครื่องมือบอกให้เว็บทำงานตอนโหลดเสร็จ
import { auth } from './firebase' // 2. กุญแจ Firebase ของเรา
import { onAuthStateChanged } from 'firebase/auth' // 3. เรดาร์ตรวจจับผู้ใช้ของ Firebase
import { useAuthStore } from './stores/auth' // 4. สมองส่วนกลางของเรา

const authStore = useAuthStore()

// 5. เมื่อหน้าเว็บโหลดขึ้นมา (กด F5) ให้ทำคำสั่งในนี้
onMounted(() => {
  // เปิดเรดาร์ตรวจจับว่ามีใครล็อกอินค้างไว้ไหม
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // ถ้า Firebase บอกว่า "เจอคนล็อกอินค้างไว้นะ!" -> ให้ดึงข้อมูลมาใส่ Pinia
      authStore.setUser(user)
      console.log("รีเฟรชแล้ว แต่ยังจำได้ว่าใครล็อกอิน:", user.email)
    } else {
      // ถ้าไม่มีคนล็อกอิน -> ให้ล้างข้อมูลทิ้ง
      authStore.clearUser()
    }
  })
})
</script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style>
/* คงความสวยงามของคุณไว้เหมือนเดิมได้เลยครับ */
</style>