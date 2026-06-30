import { useAuth } from "@/Contex/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── cache helpers ─────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000;
const locationCacheKey = (email: string) => `location_${email}`;

const getLocationCache = (email: string) => {
  try {
    const raw = sessionStorage.getItem(locationCacheKey(email));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      sessionStorage.removeItem(locationCacheKey(email));
      return null;
    }
    return data;
  } catch { return null; }
};

const setLocationCache = (email: string, data: unknown) => {
  try {
    sessionStorage.setItem(locationCacheKey(email), JSON.stringify({ data, ts: Date.now() }));
  } catch {}
};

const clearLocationCache = (email: string) => {
  sessionStorage.removeItem(locationCacheKey(email));
};
// ─────────────────────────────────────────────────────────────

const BD = {
  "Dhaka": {
    "Dhaka": ["Adabor","Badda","Banani","Banshal","Demra","Dhanmondi","Dohar","Gandaria","Gulshan","Hazaribagh","Kadamtali","Kamrangirchar","Keraniganj","Khilgaon","Khilkhet","Kotwali","Lalbagh","Mirpur","Mohammadpur","Motijheel","Nawabganj","New Market","Paltan","Ramna","Savar","Shyampur","Sutrapur","Tejgaon","Turag","Uttarkhan","Uttara","Wari"],
    "Narayanganj": ["Araihazar","Bandar","Narayanganj Sadar","Rupganj","Sonargaon"],
    "Gazipur": ["Kaliakair","Kaliganj","Kapasia","Gazipur Sadar","Sreepur","Tongi"],
    "Manikganj": ["Daulatpur","Ghior","Harirampur","Manikganj Sadar","Shibalaya","Saturia","Singair"],
    "Munshiganj": ["Gazaria","Louhajang","Munshiganj Sadar","Sreenagar","Sirajdikhan","Tongibari"],
    "Narsingdi": ["Belabo","Monohardi","Narsingdi Sadar","Palash","Raipura","Shibpur"],
    "Tangail": ["Basail","Bhuapur","Delduar","Dhanbari","Ghatail","Gopalpur","Kalihati","Madhupur","Mirzapur","Nagarpur","Sakhipur","Tangail Sadar"],
    "Kishoreganj": ["Astagram","Bajitpur","Bhairab","Hossainpur","Itna","Katiadi","Karimganj","Kishoreganj Sadar","Kuliarchar","Mithamain","Nikli","Pakundia","Tarail"],
    "Faridpur": ["Alfadanga","Bhanga","Boalmari","Char Bhadrasan","Faridpur Sadar","Madhukhali","Nagarkanda","Saltha"],
    "Gopalganj": ["Kashiani","Kotalipara","Muksudpur","Gopalganj Sadar","Tungipara"],
    "Madaripur": ["Kalkini","Madaripur Sadar","Rajoir","Shibchar"],
    "Shariatpur": ["Damudya","Gosairhat","Naria","Shariatpur Sadar","Bhedarganj","Jajira"],
    "Rajbari": ["Baliakandi","Goalanda","Kalukhali","Pangsha","Rajbari Sadar"],
  },
  "Chattogram": {
    "Chattogram": ["Anwara","Banshkhali","Boalkhali","Chandanaish","Chattogram Port","Double Mooring","Fatikchhari","Hathazari","Karnaphuli","Khulshi","Kotwali","Lohagara","Mirsharai","Patiya","Raozan","Rangunia","Satkania","Sitakunda","Sandwip"],
    "Cumilla": ["Barura","Brahmanpara","Burichang","Chandina","Chauddagram","Daudkandi","Debidwar","Homna","Cumilla Adarsha Sadar","Cumilla Sadar South","Laksam","Lalmai","Meghna","Monohorgonj","Muradnagar","Nangalkot","Titas"],
    "Brahmanbaria": ["Akhaura","Ashuganj","Banchaharampur","Brahmanbaria Sadar","Kasba","Nasirnagar","Nabinagar","Sarail"],
    "Chandpur": ["Chandpur Sadar","Faridganj","Haimchar","Haziganj","Kachua","Matlab North","Matlab South","Shahrasti"],
    "Noakhali": ["Begumganj","Chatkhil","Companiganj","Hatiya","Kabirhat","Noakhali Sadar","Senbagh","Sonaimuri","Subarnachar"],
    "Lakshmipur": ["Kamalnagar","Lakshmipur Sadar","Ramganj","Ramgati","Raipur"],
    "Feni": ["Chhagalnaiya","Daganbhuiyan","Feni Sadar","Fulgazi","Parshuram","Sonagazi"],
    "Cox's Bazar": ["Chakaria","Cox's Bazar Sadar","Kutubdia","Maheshkhali","Pekua","Ramu","Teknaf","Ukhia"],
    "Khagrachhari": ["Dighinala","Guimara","Khagrachhari Sadar","Lakshmichhari","Mahalchhari","Manikchhari","Panchhari","Ramgarh"],
    "Rangamati": ["Baghaichhari","Barkal","Belaichhari","Kaptai","Juraichhari","Kaukhali","Langadu","Naniarchar","Rajasthali","Rangamati Sadar"],
    "Bandarban": ["Alikadam","Bandarban Sadar","Lama","Naikhongchhari","Rowangchhari","Ruma","Thanchi"],
  },
  "Rajshahi": {
    "Rajshahi": ["Bagmara","Bagha","Boalia","Charghat","Durgapur","Godagari","Matihar","Mohanpur","Paba","Puthia","Rajpara","Shah Mokhdum","Tanore"],
    "Natore": ["Bagatipara","Baraigram","Gurudaspur","Lalpur","Natore Sadar","Singra"],
    "Naogaon": ["Atrai","Badalgachhi","Manda","Mahadebpur","Naogaon Sadar","Niamatpur","Patnitala","Porsha","Raninagar","Sapahar"],
    "Chapainawabganj": ["Bholahat","Gomastapur","Nachol","Chapainawabganj Sadar","Shibganj"],
    "Pabna": ["Atgharia","Bera","Bhangura","Chatmohar","Ishwardi","Faridpur","Pabna Sadar","Santhia","Sujanagar"],
    "Sirajganj": ["Belkuchi","Chauhali","Kamarkhanda","Kazipur","Raiganj","Shahzadpur","Sirajganj Sadar","Tarash","Ullapara"],
    "Bogura": ["Adamdighi","Bogura Sadar","Dhunat","Dupchanchiya","Gabtali","Kahaloo","Nandigram","Sariakandi","Shajahanpur","Sherpur","Sonatola"],
    "Joypurhat": ["Akkelpur","Joypurhat Sadar","Kalai","Khetlal","Panchbibi"],
  },
  "Khulna": {
    "Khulna": ["Batiaghata","Dacope","Dighalia","Dumuria","Fultala","Khalishpur","Koyra","Paikgachha","Rupsha","Sonadanga","Terkhada"],
    "Jashore": ["Abhaynagar","Bagherpara","Chougachha","Jhikargachha","Keshabpur","Manirampur","Sharsha","Jashore Sadar"],
    "Satkhira": ["Assasuni","Debhata","Kaliganj","Kolaroa","Satkhira Sadar","Shyamnagar","Tala"],
    "Bagerhat": ["Bagerhat Sadar","Chitalmari","Fakirhat","Kachua","Mongla","Morrelganj","Mollahat","Rampal","Sarankhola"],
    "Jhenaidah": ["Harinakunda","Jhenaidah Sadar","Kaliganj","Kotchandpur","Maheshpur","Shailkupa"],
    "Magura": ["Magura Sadar","Mohammadpur","Shalikha","Sreepur"],
    "Narail": ["Kalia","Lohagara","Narail Sadar"],
    "Kushtia": ["Bheramara","Daulatpur","Khoksa","Kumarkhali","Kushtia Sadar","Mirpur"],
    "Meherpur": ["Gangni","Meherpur Sadar","Mujibnagar"],
    "Chuadanga": ["Alamdanga","Chuadanga Sadar","Damurhuda","Jibannagar"],
  },
  "Barishal": {
    "Barishal": ["Agailjhara","Bakerganj","Banaripara","Barishal Sadar","Babuganj","Gournadi","Hijla","Mehendiganj","Muladi","Wazirpur"],
    "Pirojpur": ["Bhandaria","Indurkani","Kawkhali","Mathbaria","Nazirpur","Nesarabad","Pirojpur Sadar"],
    "Jhalokati": ["Kanthalia","Jhalokati Sadar","Nalchity","Rajapur"],
    "Barguna": ["Amtali","Bamna","Barguna Sadar","Betagi","Patharghata","Taltali"],
    "Patuakhali": ["Bauphal","Galachipa","Kalapara","Mirzaganj","Patuakhali Sadar","Dashmina","Rangabali"],
    "Bhola": ["Borhanuddin","Char Fasson","Daulatkhan","Lalmohan","Manpura","Tajumuddin","Bhola Sadar"],
  },
  "Sylhet": {
    "Sylhet": ["Balaganj","Beanibazar","Bishwanath","Companiganj","Fenchuganj","Golapganj","Gowainghat","Jakiganj","Kanaighat","Osmaninagar","South Surma","Sylhet Sadar"],
    "Sunamganj": ["Bishwamvarpur","Chhatak","South Sunamganj","Dowarabazar","Jagannathpur","Jamalganj","Shalla","Sunamganj Sadar","Tahirpur","Dharmapasha","Madhyanagar"],
    "Habiganj": ["Ajmiriganj","Bahubal","Baniachong","Chunarughat","Habiganj Sadar","Lakhai","Madhabpur","Nabiganj"],
    "Moulvibazar": ["Barlekha","Kamalganj","Kulaura","Moulvibazar Sadar","Rajnagar","Sreemangal"],
  },
  "Rangpur": {
    "Rangpur": ["Badarganj","Gangachara","Kaunia","Mithapukur","Pirganj","Pirgachha","Rangpur Sadar","Taraganj"],
    "Dinajpur": ["Birol","Birampur","Bochaganj","Chirirbandar","Dinajpur Sadar","Ghoraghat","Hakimpur","Khansama","Nawabganj","Parbatipur"],
    "Nilphamari": ["Dimla","Domar","Jaldhaka","Kishoreganj","Nilphamari Sadar","Saidpur"],
    "Lalmonirhat": ["Aditmari","Kaliganj","Hatibandha","Lalmonirhat Sadar","Patgram"],
    "Kurigram": ["Bhurungamari","Char Rajibpur","Chilmari","Fulbari","Kurigram Sadar","Nageshwari","Rowmari","Rajarhat","Ulipur"],
    "Gaibandha": ["Fulchhari","Gaibandha Sadar","Gobindaganj","Palashbari","Sadullapur","Saghata","Sundarganj"],
    "Panchagarh": ["Atwari","Boda","Debiganj","Panchagarh Sadar","Tentulia"],
    "Thakurgaon": ["Baliadangi","Haripur","Pirganj","Ranisankail","Thakurgaon Sadar"],
  },
  "Mymensingh": {
    "Mymensingh": ["Bhaluka","Dhobaura","Fulpur","Gaffargaon","Gauripur","Haluaghat","Ishwarganj","Mymensingh Sadar","Muktagachha","Nandail","Fulbaria","Tarakanda","Trishal"],
    "Netrokona": ["Atpara","Barhatta","Durgapur","Khaliajuri","Kalmakanda","Kendua","Madan","Mohanganj","Netrokona Sadar","Purbadhala"],
    "Jamalpur": ["Bakshiganj","Dewanganj","Islampur","Jamalpur Sadar","Madarganj","Melandah","Sarishabari"],
    "Sherpur": ["Jhenaigati","Nakla","Nalitabari","Sherpur Sadar","Sreebordi"],
  },
};

const DIVISIONS = Object.keys(BD).sort();

type FormData = {
  name: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  area: string;
  address: string;
  landmark: string;
  email: string;
};

const emptyForm: FormData = {
  name: "", phone: "", division: "", district: "",
  upazila: "", area: "", address: "", landmark: "", email: "",
};

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "12px 16px",
  fontSize: 14,
  borderRadius: 10,
  border: `1.5px solid ${hasError ? "#f87171" : "#334155"}`,
  outline: "none",
  background: "#1e293b",
  color: "#f8fafc",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "all 0.2s ease",
});

const selectStyle = (hasError: boolean, disabled: boolean): React.CSSProperties => ({
  ...inputStyle(hasError),
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.4 : 1,
});

function Field({ label, required, error, children }: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#f87171" }}> *</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: 12, color: "#f87171", marginTop: 4, fontWeight: 500 }}>{error}</p>}
    </div>
  );
}

function SavedAddressCard({ data, onEdit, onDelete }: {
  data: FormData;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div style={{
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: 14,
      padding: "1.25rem 1.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>{data.name}</span>
        <span style={{ fontSize: 13, color: "#64748b" }}>{data.phone}</span>
        <span style={{
          background: "#f97316", color: "#fff", fontSize: 10,
          fontWeight: 700, borderRadius: 4, padding: "2px 8px", marginLeft: "auto"
        }}>DEFAULT</span>
      </div>
      <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>
        {data.address}, {data.area}, {data.upazila}, {data.district}, {data.division}
        {data.landmark && <><br />Near: {data.landmark}</>}
      </p>
      <div style={{
        display: "flex", gap: 10, marginTop: 14,
        borderTop: "1px solid #334155", paddingTop: 12
      }}>
        <button onClick={onEdit} style={{
          background: "transparent", border: "1px solid #3b82f6",
          color: "#3b82f6", borderRadius: 7, padding: "6px 16px",
          fontSize: 13, fontWeight: 600, cursor: "pointer"
        }}>✏️ Edit</button>
        <button onClick={onDelete} style={{
          background: "transparent", border: "1px solid #ef4444",
          color: "#ef4444", borderRadius: 7, padding: "6px 16px",
          fontSize: 13, fontWeight: 600, cursor: "pointer"
        }}>🗑 Delete</button>
      </div>
    </div>
  );
}

const API = import.meta.env.VITE_API;

export default function DeliveryForm({ onSubmit }: { onSubmit?: (data: FormData) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedData, setSavedData] = useState<FormData | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm]           = useState<FormData>({ ...emptyForm, email: user?.email || "" });
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(false);

  const districts = form.division ? Object.keys(BD[form.division as keyof typeof BD]).sort() : [];
  const upazilas  = form.district ? (BD[form.division as keyof typeof BD] as any)[form.district] : [];

  // ── Page load এ address fetch ──────────────────────────────
  useEffect(() => {
    if (!user?.email) return;

    // cache check
    const cached = getLocationCache(user.email);
    if (cached) {
      setSavedData(cached);
      return;
    }

    fetch(`${API}/userlocation?email=${encodeURIComponent(user.email)}`, {
      headers: {
        'x-api-key': import.meta.env.VITE_API_KEY,
         'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      }
    })
      .then(r => r.json())
      .then(data => {
        if (data && !data.error && data.name) {
          setLocationCache(user.email, data); // cache save
          setSavedData(data);
        } else {
          setShowForm(true);
        }
      })
      .catch(() => setShowForm(true));
  }, [user?.email]);
  // ──────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === "division" ? { district: "", upazila: "" } : {}),
      ...(name === "district" ? { upazila: "" } : {}),
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!/^01[3-9]\d{8}$/.test(form.phone)) e.phone = "Invalid BD number";
    if (!form.division) e.division = "Required";
    if (!form.district) e.district = "Required";
    if (!form.upazila) e.upazila = "Required";
    if (!form.area.trim()) e.area = "Area required";
    if (!form.address.trim()) e.address = "Address required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (isEditing) {
        // UPDATE
        const res = await fetch(`${API}/userlocation?email=${encodeURIComponent(form.email)}`, {
          method: "PUT",
          headers: {
            'x-api-key': import.meta.env.VITE_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setLocationCache(form.email, updated); // cache update
        setSavedData(updated);
      } else {
        // POST
        const res = await fetch(`${API}/userlocation`, {
          method: "POST",
          headers: {
            'x-api-key': import.meta.env.VITE_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setLocationCache(form.email, created); // cache save
        setSavedData(created);
      }
      setShowForm(false);
      setIsEditing(false);
      if (onSubmit) onSubmit(form);
      window.dispatchEvent(new Event('location-updated'));
      navigate(-1);
    } catch (err) {
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (savedData) {
      setForm(savedData);
      setIsEditing(true);
      setShowForm(true);
    }
  };

  const handleDelete = async () => {
    if (!user?.email || !confirm("Address delete করবেন?")) return;
    await fetch(`${API}/userlocation?email=${encodeURIComponent(user.email)}`, {
      method: "DELETE",
      headers: { 'x-api-key': import.meta.env.VITE_API_KEY }
    });
    clearLocationCache(user.email); // cache clear
    setSavedData(null);
    setForm({ ...emptyForm, email: user.email });
    setIsEditing(false);
    setShowForm(true);
    window.dispatchEvent(new Event('location-updated'));
  };

  return (
    <div style={{
      maxWidth: 650,
      minHeight: "80vh",
      margin: "0 auto",       // ← white bar fix
      padding: "3.5rem",
      paddingTop: "6rem",     // ← Navbar এর নিচে content
      borderRadius: 20,
      background: "#0f172a",
      border: "1px solid #1e293b",
      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
    }}>
      <header style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#f8fafc", marginBottom: 8 }}>
          📦 Delivery Information
        </h2>
        <p style={{ fontSize: 14, color: "#64748b" }}>
          {savedData && !showForm ? "Your saved delivery address" : "Fill the form to place your order"}
        </p>
      </header>

      {/* ── Saved card ── */}
      {savedData && !showForm && (
        <SavedAddressCard
          data={savedData}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* ── Form ── */}
      {showForm && (
        <form onSubmit={handleSubmit}>
          <section>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "1.5rem", borderBottom: "1px solid #1e293b", paddingBottom: 8 }}>
              Recipient Details
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Field label="Full Name" required error={errors.name}>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Shazad Ahamed" style={inputStyle(!!errors.name)} />
              </Field>
              <Field label="Mobile Number" required error={errors.phone}>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="01XXXXXXXXX" maxLength={11} style={inputStyle(!!errors.phone)} />
              </Field>
            </div>
          </section>

          <section style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "1.5rem", borderBottom: "1px solid #1e293b", paddingBottom: 8 }}>
              Shipping Address
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Division" required error={errors.division}>
                <select name="division" value={form.division} onChange={handleChange} style={selectStyle(!!errors.division, false)}>
                  <option value="">Select</option>
                  {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="District" required error={errors.district}>
                <select name="district" value={form.district} onChange={handleChange} disabled={!form.division} style={selectStyle(!!errors.district, !form.division)}>
                  <option value="">{form.division ? "Select" : "..."}</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Upazila" required error={errors.upazila}>
                <select name="upazila" value={form.upazila} onChange={handleChange} disabled={!form.district} style={selectStyle(!!errors.upazila, !form.district)}>
                  <option value="">{form.district ? "Select" : "..."}</option>
                  {upazilas.map((u: string) => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Area / Ward" required error={errors.area}>
              <input name="area" value={form.area} onChange={handleChange} placeholder="Enter your mohalla or para" style={inputStyle(!!errors.area)} />
            </Field>
            <Field label="Full Address" required error={errors.address}>
              <input name="address" value={form.address} onChange={handleChange} placeholder="your full address" style={inputStyle(!!errors.address)} />
            </Field>
            <Field label="Landmark (Optional)">
              <input name="landmark" value={form.landmark} onChange={handleChange} placeholder="e.g. Near Big Mosque" style={inputStyle(false)} />
            </Field>
          </section>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: 15, background: "#2563eb",
            color: "#fff", border: "none", borderRadius: 12,
            fontSize: 16, fontWeight: 600, cursor: "pointer", marginTop: 20,
          }}>
            {loading ? "Saving..." : isEditing ? "💾 Update Address" : "Confirm Order →"}
          </button>

          {isEditing && (
            <button type="button" onClick={() => { setShowForm(false); setIsEditing(false); }} style={{
              width: "100%", padding: 12, background: "transparent",
              color: "#64748b", border: "1px solid #334155", borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 10,
            }}>
              Cancel
            </button>
          )}
        </form>
      )}
    </div>
  );
}
