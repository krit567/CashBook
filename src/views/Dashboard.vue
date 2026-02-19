<script setup>
import { ref, computed, onMounted } from 'vue'
import { db, auth } from '../firebase'
// 🌟 1. เพิ่ม updateDoc เพื่อใช้เปลี่ยนสถานะ user
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const text = ref('')
const amount = ref('')
const type = ref('expense') 

const transactions = ref([]) 
const pendingUsers = ref([]) // 🌟 2. กล่องเก็บรายชื่อคนรออนุมัติ
const isAdmin = ref(false) 

onMounted(async () => {
  if (authStore.user) {
    const userRef = doc(db, 'users', authStore.user.uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists() && userSnap.data().role === 'admin') {
      isAdmin.value = true
      
      // 🌟 3. ถ้าเป็น Admin ให้เปิดเรดาร์ดักฟัง "รายชื่อคนรออนุมัติ"
      const usersQuery = query(collection(db, 'users'), where('status', '==', 'pending'))
      onSnapshot(usersQuery, (snapshot) => {
        const users = []
        snapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() })
        })
        pendingUsers.value = users
      })
    }

    // เรดาร์ดักฟังรายการเงิน (เหมือนเดิม)
    let q;
    if (isAdmin.value) {
      q = query(collection(db, 'transactions'))
    } else {
      q = query(collection(db, 'transactions'), where('uid', '==', authStore.user.uid))
    }

    onSnapshot(q, (snapshot) => {
      const docs = []
      snapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() }))
      docs.sort((a, b) => {
        const timeA = a.createdAt ? a.createdAt.toMillis() : Date.now()
        const timeB = b.createdAt ? b.createdAt.toMillis() : Date.now()
        return timeB - timeA
      })
      transactions.value = docs
    })
  }
})

// 🌟 4. ฟังก์ชันสำหรับ Admin กดอนุมัติ
const approveUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, { status: 'active' }) // เปลี่ยนสถานะเป็น active เพื่อให้เขา login ได้
    alert("✅ อนุมัติผู้ใช้เรียบร้อยแล้ว!")
  } catch (error) {
    alert("❌ เกิดข้อผิดพลาด: " + error.message)
  }
}

// 🌟 5. ฟังก์ชันสำหรับ Admin กดปฏิเสธ (ลบทิ้ง)
const rejectUser = async (userId) => {
  if (confirm("❌ คุณแน่ใจที่จะปฏิเสธและลบบัญชีนี้ทิ้งหรือไม่?")) {
    try {
      await deleteDoc(doc(db, 'users', userId))
    } catch (error) {
      alert("❌ เกิดข้อผิดพลาด: " + error.message)
    }
  }
}

// --- ส่วนคำนวณเงิน (เหมือนเดิม) ---
const timeFilter = ref('all') 
const filteredTransactions = computed(() => {
  const now = new Date()
  return transactions.value.filter(t => {
    if (!t.createdAt) return true 
    const tDate = new Date(t.createdAt.toMillis()) 
    if (timeFilter.value === 'day') return tDate.getDate() === now.getDate() && tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
    if (timeFilter.value === 'week') {
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(now.getDate() - 7)
      return tDate >= sevenDaysAgo
    }
    if (timeFilter.value === 'month') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
    return true 
  })
})
const totalIncome = computed(() => filteredTransactions.value.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))
const totalExpense = computed(() => filteredTransactions.value.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))
const balance = computed(() => totalIncome.value - totalExpense.value)

const addTransaction = async () => {
  if (!text.value || !amount.value) return
  try {
    await addDoc(collection(db, 'transactions'), {
      uid: authStore.user.uid,
      email: authStore.user.email,
      text: text.value,
      amount: Number(amount.value),
      type: type.value,
      createdAt: serverTimestamp()
    })
    text.value = ''; amount.value = ''
  } catch (error) { alert("❌ เกิดข้อผิดพลาด: " + error.message) }
}

const deleteTransaction = async (id) => {
  if (confirm("🗑️ คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) {
    try { await deleteDoc(doc(db, 'transactions', id)) } 
    catch (error) { alert("❌ เกิดข้อผิดพลาดในการลบ: " + error.message) }
  }
}

const logout = async () => {
  try { await signOut(auth); authStore.clearUser(); router.push('/') } 
  catch (error) { alert("เกิดข้อผิดพลาดในการออกจากระบบ") }
}
</script>

<template>
  <div class="dashboard-container">
    
    <header class="header-card">
      <div>
        <h1 class="app-title">💰 CashBook</h1>
        <p class="user-info" v-if="authStore.user">
          {{ authStore.user.email }}
          <span v-if="isAdmin" class="badge-admin">👑 ADMIN</span>
        </p>
      </div>
      <button @click="logout" class="btn btn-danger">ออกจากระบบ</button>
    </header>

    <section v-if="isAdmin && pendingUsers.length > 0" class="admin-section card">
      <h3 style="color: #f39c12;">🔔 คำขออนุมัติเข้าใช้งาน ({{ pendingUsers.length }})</h3>
      <div class="table-responsive">
        <table class="data-table">
          <thead style="background: #fef9e7;">
            <tr>
              <th>อีเมลผู้สมัคร</th>
              <th>วันที่สมัคร</th>
              <th class="text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in pendingUsers" :key="u.id">
              <td>{{ u.email }}</td>
              <td class="text-muted">{{ u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('th-TH') : '-' }}</td>
              <td class="text-center">
                <button @click="approveUser(u.id)" class="btn btn-success btn-sm" style="margin-right: 5px;">✅ อนุมัติ</button>
                <button @click="rejectUser(u.id)" class="btn btn-danger btn-sm">❌ ปฏิเสธ</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="summary-section">
      <div class="filter-box">
        <label>📊 สรุปยอดเงิน: </label>
        <select v-model="timeFilter" class="input-field">
          <option value="day">📅 วันนี้</option>
          <option value="week">📆 ย้อนหลัง 7 วัน</option>
          <option value="month">🗓️ เดือนนี้</option>
          <option value="all">♾️ ทั้งหมด</option>
        </select>
      </div>
      <div class="summary-cards">
        <div class="card income-card"><p>🟢 รายรับรวม</p><h2>+{{ totalIncome.toLocaleString() }} ฿</h2></div>
        <div class="card expense-card"><p>🔴 รายจ่ายรวม</p><h2>-{{ totalExpense.toLocaleString() }} ฿</h2></div>
        <div class="card balance-card"><p>💰 ยอดคงเหลือ</p><h2 :class="{'text-red': balance < 0}">{{ balance.toLocaleString() }} ฿</h2></div>
      </div>
    </section>

    <section class="add-section card">
      <h3>➕ เพิ่มรายการใหม่</h3>
      <form @submit.prevent="addTransaction" class="add-form">
        <input type="text" v-model="text" placeholder="ชื่อรายการ..." required class="input-field">
        <input type="number" v-model="amount" placeholder="จำนวนเงิน" required min="1" class="input-field amount-input">
        <select v-model="type" class="input-field type-select">
          <option value="income">รายรับ 📈</option>
          <option value="expense">รายจ่าย 📉</option>
        </select>
        <button type="submit" class="btn btn-success">บันทึก</button>
      </form>
    </section>

    <section class="table-section card">
      <h3>📜 ประวัติรายการ ({{ filteredTransactions.length }})</h3>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>วันที่</th>
              <th v-if="isAdmin">เจ้าของบัญชี</th>
              <th>รายการ</th>
              <th>ประเภท</th>
              <th class="text-right">จำนวนเงิน</th>
              <th class="text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredTransactions.length === 0">
              <td :colspan="isAdmin ? 6 : 5" class="text-center empty-state">ไม่มีรายการในช่วงเวลานี้ครับ 🥺</td>
            </tr>
            <tr v-for="item in filteredTransactions" :key="item.id">
              <td class="text-muted">{{ item.createdAt ? new Date(item.createdAt.toMillis()).toLocaleDateString('th-TH') : 'บันทึก...' }}</td>
              <td v-if="isAdmin" class="admin-email">{{ item.email || '-' }}</td>
              <td class="font-medium">{{ item.text }}</td>
              <td><span :class="item.type === 'income' ? 'badge-income' : 'badge-expense'">{{ item.type === 'income' ? 'รายรับ' : 'รายจ่าย' }}</span></td>
              <td class="text-right font-bold" :class="item.type === 'income' ? 'text-green' : 'text-red'">{{ item.type === 'income' ? '+' : '-' }}{{ item.amount.toLocaleString() }}</td>
              <td class="text-center"><button @click="deleteTransaction(item.id)" class="btn-icon">🗑️</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* CSS เหมือนเดิม เพิ่มเติมปุ่มขนาดเล็ก */
.dashboard-container { max-width: 900px; margin: 0 auto; padding: 20px; font-family: sans-serif; color: #333; }
.header-card { display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 20px; }
.app-title { margin: 0; font-size: 24px; }
.badge-admin { background: #ffd700; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 11px; margin-left: 8px; }
.card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 20px; margin-bottom: 20px; }
.summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
.income-card h2 { color: #10b981; } .expense-card h2 { color: #ef4444; }
.add-form { display: flex; flex-wrap: wrap; gap: 10px; }
.input-field { padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
.table-responsive { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; min-width: 600px; }
.data-table th { background: #f8f9fa; padding: 12px; border-bottom: 2px solid #ddd; }
.data-table td { padding: 12px; border-bottom: 1px solid #eee; }
.badge-income { background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 20px; font-size: 13px; }
.badge-expense { background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 20px; font-size: 13px; }
.btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
.btn-sm { padding: 5px 10px; font-size: 12px; }
.btn-success { background: #10b981; color: white; }
.btn-danger { background: #ef4444; color: white; }
.btn-icon { background: none; border: none; font-size: 18px; cursor: pointer; }
.admin-section { border: 2px solid #f39c12; }
.text-right { text-align: right; } .text-center { text-align: center; }
.text-green { color: #10b981; } .text-red { color: #ef4444; }
</style>