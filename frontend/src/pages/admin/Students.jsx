import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Modal, Confirm, Input, Select, Btn, Badge, PageHeader, EmptyState, LoadingPage } from "../../components/UI";
import { Plus, Search, Edit2, Trash2, Eye, GraduationCap } from "lucide-react";

const EMPTY = { name:"",email:"",password:"student123",phone:"",address:"",grade:"",section:"A",gender:"Male",dateOfBirth:"",parentName:"",parentPhone:"" };

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeF, setGradeF] = useState("");
  const [modal, setModal] = useState(null); // null|"add"|"edit"|"view"
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try { const r = await api.get("/students", { params:{search,grade:gradeF} }); setStudents(r.data.data); }
    catch { toast.error("Failed to load students"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, [search, gradeF]);

  const openAdd = () => { setForm(EMPTY); setSel(null); setModal("add"); };
  const openEdit = s => {
    setSel(s); setModal("edit");
    setForm({ name:s.user?.name||"",email:s.user?.email||"",password:"",phone:s.user?.phone||"",address:s.user?.address||"",grade:s.grade||"",section:s.section||"A",gender:s.gender||"Male",dateOfBirth:s.dateOfBirth?s.dateOfBirth.slice(0,10):"",parentName:s.parentName||"",parentPhone:s.parentPhone||"" });
  };
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const save = async () => {
    if (!form.name||!form.email||!form.grade) return toast.error("Name, email and grade are required");
    setSaving(true);
    try {
      if (modal==="add") { await api.post("/students",form); toast.success("Student added"); }
      else { await api.put("/students/"+sel._id,form); toast.success("Student updated"); }
      setModal(null); fetch();
    } catch(err) { toast.error(err.response?.data?.message||"Failed"); }
    finally { setSaving(false); }
  };

  const del = async () => {
    try { await api.delete("/students/"+confirmId); toast.success("Student removed"); setConfirmId(null); fetch(); }
    catch { toast.error("Delete failed"); }
  };

  if (loading) return <LoadingPage/>;
  return (
    <div>
      <PageHeader title="Students" sub="Manage enrolled students"
        action={<Btn icon={Plus} onClick={openAdd}>Add Student</Btn>}/>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Search size={14} className="text-slate-400"/>
          <input className="bg-transparent text-sm outline-none w-44" placeholder="Search students..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select value={gradeF} onChange={e=>setGradeF(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 outline-none">
          <option value="">All Grades</option>
          {["Grade 9","Grade 10","Grade 11","Grade 12"].map(g=><option key={g}>{g}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100 bg-slate-50">
            {["Student","ID","Grade","Gender","Parent","Actions"].map(h=><th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {students.length===0
              ? <tr><td colSpan={6}><EmptyState icon={GraduationCap} message="No students found"/></td></tr>
              : students.map(s=>(
              <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{s.user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"?"}</div>
                    <div><div className="text-sm font-semibold text-slate-800">{s.user?.name}</div><div className="text-xs text-slate-400">{s.user?.email}</div></div>
                  </div>
                </td>
                <td className="px-4 py-3"><Badge color="gray">{s.studentId||"—"}</Badge></td>
                <td className="px-4 py-3"><Badge color="blue">{s.grade} {s.section}</Badge></td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.gender}</td>
                <td className="px-4 py-3"><div className="text-sm text-slate-700">{s.parentName||"—"}</div><div className="text-xs text-slate-400">{s.parentPhone}</div></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={()=>{setSel(s);setModal("view");}} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Eye size={14}/></button>
                    <button onClick={()=>openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit2 size={14}/></button>
                    <button onClick={()=>setConfirmId(s._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal==="add"||modal==="edit"} onClose={()=>setModal(null)} title={modal==="add"?"Add New Student":"Edit Student"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name *" value={form.name} onChange={f("name")} placeholder="John Doe"/>
          <Input label="Email *" type="email" value={form.email} onChange={f("email")} placeholder="student@email.com" disabled={modal==="edit"}/>
          {modal==="add" && <Input label="Password" type="password" value={form.password} onChange={f("password")} placeholder="student123"/>}
          <Input label="Phone" value={form.phone} onChange={f("phone")} placeholder="+250788000000"/>
          <Select label="Grade *" value={form.grade} onChange={f("grade")}>
            <option value="">Select grade</option>
            {["Grade 9","Grade 10","Grade 11","Grade 12"].map(g=><option key={g}>{g}</option>)}
          </Select>
          <Select label="Section" value={form.section} onChange={f("section")}>
            {["A","B","C"].map(s=><option key={s} value={s}>Section {s}</option>)}
          </Select>
          <Select label="Gender" value={form.gender} onChange={f("gender")}>
            {["Male","Female","Other"].map(g=><option key={g}>{g}</option>)}
          </Select>
          <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={f("dateOfBirth")}/>
          <Input label="Parent Name" value={form.parentName} onChange={f("parentName")} placeholder="Parent name"/>
          <Input label="Parent Phone" value={form.parentPhone} onChange={f("parentPhone")} placeholder="+250788000000"/>
          <Input label="Address" value={form.address} onChange={f("address")} placeholder="Address" className="sm:col-span-2"/>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
          <Btn loading={saving} onClick={save}>{modal==="add"?"Add Student":"Save Changes"}</Btn>
        </div>
      </Modal>

      {/* View Modal */}
      {modal==="view" && sel && (
        <Modal open title="Student Details" onClose={()=>setModal(null)}>
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
              {sel.user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"?"}
            </div>
            <h3 className="font-bold text-slate-800 text-lg">{sel.user?.name}</h3>
            <p className="text-slate-400 text-sm">{sel.user?.email}</p>
            <Badge color="blue" className="mt-2">{sel.studentId}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["Grade",`${sel.grade} ${sel.section}`],["Gender",sel.gender],["Phone",sel.user?.phone||"—"],["Parent",sel.parentName||"—"],["Parent Phone",sel.parentPhone||"—"],["Courses",sel.courses?.length||0]].map(([l,v])=>(
              <div key={l} className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-400 mb-1">{l}</div><div className="font-semibold text-sm text-slate-700">{String(v)}</div></div>
            ))}
          </div>
        </Modal>
      )}

      <Confirm open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={del} title="Delete Student" message="This action cannot be undone. The student will be deactivated."/>
    </div>
  );
}
