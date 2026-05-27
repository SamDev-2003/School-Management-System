import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Modal, Confirm, Input, Select, Btn, Badge, PageHeader, EmptyState, LoadingPage } from "../../components/UI";
import { Plus, Search, Edit2, Trash2, Eye, Users } from "lucide-react";

const EMPTY = { name:"",email:"",password:"teacher123",phone:"",address:"",subject:"",department:"",qualification:"",experience:0 };

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try { const r = await api.get("/teachers",{params:{search}}); setTeachers(r.data.data); }
    catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(()=>{fetch();},[search]);

  const openAdd = ()=>{ setForm(EMPTY); setSel(null); setModal("add"); };
  const openEdit = t =>{ setSel(t); setModal("edit"); setForm({name:t.user?.name||"",email:t.user?.email||"",password:"",phone:t.user?.phone||"",address:t.user?.address||"",subject:t.subject||"",department:t.department||"",qualification:t.qualification||"",experience:t.experience||0}); };
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const save = async ()=>{
    if(!form.name||!form.email||!form.subject) return toast.error("Name, email and subject required");
    setSaving(true);
    try {
      if(modal==="add"){ await api.post("/teachers",form); toast.success("Teacher added"); }
      else { await api.put("/teachers/"+sel._id,form); toast.success("Updated"); }
      setModal(null); fetch();
    } catch(err){ toast.error(err.response?.data?.message||"Failed"); }
    finally{ setSaving(false); }
  };

  const del = async ()=>{ try{ await api.delete("/teachers/"+confirmId); toast.success("Removed"); fetch(); } catch{ toast.error("Failed"); } };

  if(loading) return <LoadingPage/>;
  return (
    <div>
      <PageHeader title="Teachers" sub="Manage teaching staff" action={<Btn icon={Plus} onClick={openAdd}>Add Teacher</Btn>}/>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4 flex gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Search size={14} className="text-slate-400"/>
          <input className="bg-transparent text-sm outline-none w-44" placeholder="Search teachers..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100 bg-slate-50">
            {["Teacher","ID","Subject","Department","Experience","Courses","Actions"].map(h=><th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {teachers.length===0?<tr><td colSpan={7}><EmptyState icon={Users} message="No teachers found"/></td></tr>
            :teachers.map(t=>(
              <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">{t.user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"?"}</div>
                    <div><div className="text-sm font-semibold text-slate-800">{t.user?.name}</div><div className="text-xs text-slate-400">{t.user?.email}</div></div>
                  </div>
                </td>
                <td className="px-4 py-3"><Badge color="gray">{t.teacherId||"—"}</Badge></td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-700">{t.subject}</td>
                <td className="px-4 py-3"><Badge color="purple">{t.department||"—"}</Badge></td>
                <td className="px-4 py-3 text-sm text-slate-600">{t.experience} yrs</td>
                <td className="px-4 py-3"><Badge color="blue">{t.courses?.length||0} courses</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={()=>{setSel(t);setModal("view");}} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Eye size={14}/></button>
                    <button onClick={()=>openEdit(t)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit2 size={14}/></button>
                    <button onClick={()=>setConfirmId(t._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal==="add"||modal==="edit"} onClose={()=>setModal(null)} title={modal==="add"?"Add Teacher":"Edit Teacher"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name *" value={form.name} onChange={f("name")} placeholder="Dr. Jane Smith"/>
          <Input label="Email *" type="email" value={form.email} onChange={f("email")} placeholder="teacher@sms.com" disabled={modal==="edit"}/>
          {modal==="add" && <Input label="Password" type="password" value={form.password} onChange={f("password")}/>}
          <Input label="Phone" value={form.phone} onChange={f("phone")}/>
          <Input label="Subject *" value={form.subject} onChange={f("subject")} placeholder="Mathematics"/>
          <Select label="Department" value={form.department} onChange={f("department")}>
            <option value="">Select</option>
            {["Science","Arts","Technology","Languages","Social Studies","Commerce"].map(d=><option key={d}>{d}</option>)}
          </Select>
          <Input label="Qualification" value={form.qualification} onChange={f("qualification")} placeholder="PhD Mathematics"/>
          <Input label="Experience (years)" type="number" min={0} value={form.experience} onChange={f("experience")}/>
          <Input label="Address" value={form.address} onChange={f("address")} className="sm:col-span-2"/>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
          <Btn loading={saving} onClick={save}>{modal==="add"?"Add Teacher":"Save Changes"}</Btn>
        </div>
      </Modal>

      {modal==="view" && sel && (
        <Modal open title="Teacher Profile" onClose={()=>setModal(null)}>
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">{sel.user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"?"}</div>
            <h3 className="font-bold text-slate-800 text-lg">{sel.user?.name}</h3>
            <p className="text-slate-400 text-sm">{sel.user?.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["Subject",sel.subject],["Department",sel.department||"—"],["Qualification",sel.qualification||"—"],["Experience",`${sel.experience} yrs`],["Courses",sel.courses?.length||0],["Teacher ID",sel.teacherId||"—"]].map(([l,v])=>(
              <div key={l} className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-400 mb-1">{l}</div><div className="font-semibold text-sm text-slate-700">{String(v)}</div></div>
            ))}
          </div>
        </Modal>
      )}
      <Confirm open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={del} title="Remove Teacher" message="This will deactivate the teacher account."/>
    </div>
  );
}
