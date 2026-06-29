
// src/components/Shop.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { Search, X, Clock, TrendingUp, ChevronUp } from "lucide-react";
import { useTheme } from "../App";
import AnimatedSection from "../components/AnimatedSection";
import ProductCard, { Product } from "../components/ProductCard";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";

const PAGE_SIZE = 20;
const API_KEY = import.meta.env.VITE_API_KEY;
const API_BASE = import.meta.env.VITE_API;

const HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
};

// ════════════════════════════════════════════════════════════════════
// 🔤 BENGALI TO ENGLISH TRANSLITERATION (বাংলা থেকে ইংরেজি)
// ════════════════════════════════════════════════════════════════════
const BENGALI_TO_ENGLISH: Record<string, string> = {
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'y', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
  'ক্ষ': 'kkh', 'ত্র': 'tr', 'জ্ঞ': 'gg', 'শ্র': 'shr',
  'শার্ট': 'shirt',
  'পাঞ্জাবি': 'panjabi',
  'ঘড়ি': 'watch',
  'জুতা': 'shoes',
  'স্যান্ডেল': 'sandal',
  'হেডফোন': 'headphone',
  'ইয়ারবাড': 'earbuds',
  'স্পিকার': 'speaker',
  'ক্যামেরা': 'camera',
  'ল্যাপটপ': 'laptop',
  'মোবাইল': 'mobile',
  'চার্জার': 'charger',
  'কেবল': 'cable',
  'পাওয়ারব্যাংক': 'powerbank',
  'স্মার্টওয়াচ': 'smartwatch',
  'ব্লুটুথ': 'bluetooth',
  'ওয়্যারলেস': 'wireless',
  'ফাস্ট চার্জিং': 'fast charging',
  'ওয়াটারপ্রুফ': 'waterproof',
  'আসল': 'original',
  'প্রিমিয়াম': 'premium',
  'উপহার': 'gift',
  'কম্বো': 'combo',
  'অফার': 'offer',
  'ডিসকাউন্ট': 'discount',
  'সেল': 'sale',
  'নিউ': 'new',
  'বেস্ট': 'best',
  'টপ': 'top',
  'কালো': 'black',
  'সাদা': 'white',
  'লাল': 'red',
  'নীল': 'blue',
  'সবুজ': 'green',
  'হলুদ': 'yellow',
  'গোলাপি': 'pink',
  'বেগুনি': 'purple',
  'কমলা': 'orange',
  'খাকি': 'khaki',
  'গোল্ডেন': 'golden',
  'সিলভার': 'silver',
  'মেরুন': 'maroon',
  'ছোট': 'small',
  'মাঝারি': 'medium',
  'বড়': 'large',
  'এক্সএল': 'extra large',
  'ডাবল এক্সএল': 'xxl',
  'পুরুষ': 'men',
  'মহিলা': 'women',
  'বাচ্চা': 'kids',
  'শিশু': 'kids',
  'গ্যাজেট': 'gadget',
  'ইলেকট্রনিক্স': 'electronics',
  'হোম': 'home',
  'লাইফস্টাইল': 'lifestyle',
  'খাবার': 'food',
  'শীত': 'winter',
  'গ্রীষ্ম': 'summer',
  'ঈদ': 'eid',
  'কাস্টমাইজ': 'customize',
  'গিফট': 'gift',
  'কটন': 'cotton',
  'সিল্ক': 'silk',
  'শিফন': 'chiffon',
  'জর্জেট': 'georgette',
  'ভেলভেট': 'velvet',
  'লেদার': 'leather',
  'পিইউ': 'pu',
  'নাইলন': 'nylon',
  'পলিয়েস্টার': 'polyester',
  'সুতি': 'cotton',
  'রেশম': 'silk',
  'কাশ্মীর': 'cashmere',
  'উল': 'wool',
  'ডেনিম': 'denim',
  'জিন্স': 'jeans',
  'কোরবানি': 'qurbani',
  'কসাই': 'koshai',
  'গরু': 'goru',
  'ছাগল': 'goat',
  'ঈদুল আযহা': 'eid',
  'নামাজ': 'namaz',
  'মসজিদ': 'masjid',
  'কুরআন': 'quran',
  'তেলাওয়াত': 'tilawat',
  'দোয়া': 'dua',
  'সুন্নত': 'sunnah',
  'হিজাব': 'hijab',
  'নেকাব': 'niqab',
  'বোরকা': 'burka',
  'আবায়া': 'abaya',
  'খিমার': 'khimar',
  'টুপি': 'tupi',
  'আতর': 'attar',
  'সুগন্ধি': 'perfume',
  'তসবিহ': 'tasbih',
  'জায়নামাজ': 'jainamaz',
  'কিবলা': 'qibla',
  'রমজান': 'ramadan',
  'সেহরি': 'sehri',
  'ইফতার': 'iftar',
};

// ─── বাংলা টেক্সটকে রোমানাইজ (ইংরেজি) করো ──────────────────────
function transliterateBengali(text: string): string {
  const words = text.split(' ');
  const transliteratedWords = words.map(word => {
    if (BENGALI_TO_ENGLISH[word]) {
      return BENGALI_TO_ENGLISH[word];
    }
    let wordResult = '';
    for (let j = 0; j < word.length; j++) {
      const char = word[j];
      const nextChar = j + 1 < word.length ? word[j + 1] : '';
      const conjunct = char + nextChar;
      if (BENGALI_TO_ENGLISH[conjunct]) {
        wordResult += BENGALI_TO_ENGLISH[conjunct];
        j++;
        continue;
      }
      if (BENGALI_TO_ENGLISH[char]) {
        wordResult += BENGALI_TO_ENGLISH[char];
      } else {
        wordResult += char;
      }
    }
    return wordResult;
  });
  return transliteratedWords.join(' ');
}

// ════════════════════════════════════════════════════════════════════
// 🔥 TRENDING / POPULAR SEARCHES
// ════════════════════════════════════════════════════════════════════
const TRENDING_SEARCHES = [
  "shirt", "sneakers", "watch", "laptop", "saree",
  "headphones", "jacket", "shoes", "panjabi", "smartwatch",
  "mobile", "charger", "speaker", "earphone", "camera",
  "hoodie", "wallet", "belt", "sunglass", "perfume",
];

// ════════════════════════════════════════════════════════════════════
// 📖 DICTIONARY
// ════════════════════════════════════════════════════════════════════
const DICTIONARY: Record<string, string[]> = {
  "shirt": ["shert","shart","shrit","shurt","shiert","shrt","shir","shitt","shrtt","sirt","chirt","shiet","shart","shert","shrit","shurt","sheert","shartt","shirtt","shertt","shurt"],
  "panjabi": ["punjabi","panjabee","panjabii","panjab","panjaby","pnjabi","panjaabi","punjabee","panjabhi","punyabi","panjabii","panjabi","panjabee","panjaby","panjabi"],
  "pajama": ["pyjama","pijama","pajamas","pyjamas","payjama","pijamas","pajma","pyjma","pizama","pyzama","pjama","pijama","pajamaa"],
  "trouser": ["trousers","trousar","trouzer","troser","trousur","trozar","trouzer","trawser","trous","trozer","trouser","trousser"],
  "hoodie": ["hoody","hudie","huudie","hoddie","hoodei","hudi","hudi","hoodii","hoddie","hoody","hudy","hoodiee"],
  "sweater": ["suater","sweeter","swater","swetar","sweter","sueter","sweatar","sweater","sweter","sweeta","sweatter"],
  "jacket": ["jaket","jakct","jackt","jakcet","jackett","jakket","jeket","jacet","jakit","jacked","jaket","jakeet"],
  "t-shirt": ["tshirt","t shirt","t-shirt","tshrt","t-shrt","t shirt","tshirt","teeshirt","tishirt","t-shrit","t-shart"],
  "gabardine": ["gaberdine","gabrdin","gabardin","gabardien","gabardeen","gabardine","gaberdine"],
  "cargo": ["kargo","cargoo","cargo","cargoe","cargoh"],
  "sweatshirt": ["sweat shirt","swetshirt","sweatshrt","sweat shrt","sweatshir","sweat shirt"],
  "tracksuit": ["track suit","tracksuit","trak suit","track suit","tracksoot","trak suit"],
  "belt": ["balt","blet","bellt","bilt","bilte","belt","belt","belth"],
  "wallet": ["walet","wallett","walett","walit","wallit","walet","wallet"],
  "cap": ["kap","capp","kaap","cahp","caap","caps","kaps","caaps"],
  "tupi": ["topy","toopi","tupi","tuppi","toopi","tupy","toppee"],
  "attar": ["atar","attar","athar","atter","ataar","attar","atr"],
  "perfume": ["perfum","parfume","perfume","perfom","prfume","perfume"],
  "sandal": ["sandals","sandl","sandall","sandels","sondal","sandala","sandil"],
  "slipper": ["slipar","sliper","slippar","slippr","slipor","sliper","slipper"],
  "shoe": ["shoes","shose","shos","shuse","shoze","shoees","sheos","shoose","shoos"],
  "sneaker": ["sneakers","snaeker","sneeker","snaker","snekar","sneekar","sneakr","sneackers"],
  "saree": ["sari","saari","sharee","shary","sarey","shaari","sariy","shadi","saree","saree","sarree","sari"],
  "salwar": ["shalwar","salwaar","shalwaar","shalver","solwar","salwar","salwaar"],
  "kameez": ["kamiz","kamees","kameeze","kameze","kamiz","comiz","kamij","kameez"],
  "dupatta": ["dupata","dopatta","dopata","dupataa","duppata","duppatta","dupatta","dopatta"],
  "three piece": ["3 piece","three piece","3pc","three pc","threepiece","3 pcs"],
  "burka": ["burqa","burkha","burka","burkah","borka","bourka","burqa"],
  "hijab": ["hizab","hijabb","hejab","heejab","hijob","higab","hijab","hizab"],
  "khimar": ["khimar","khimaar","khimar","khemar","khimar"],
  "abaya": ["abaia","abayah","abaaya","abaye","abaia","abaya","abayya"],
  "niqab": ["nikab","niqaab","niqabb","nikaab","niqab","nikab"],
  "blouse": ["blows","blose","blaus","blowse","blouze","blaus","blouse","bluse"],
  "leggings": ["legins","leggins","leggns","laging","leging","leggings","legings"],
  "necklace": ["neklace","necklase","necklas","neklase","neclace","neklas","necklace","nekless"],
  "earring": ["earing","earings","errings","earring","erring","earings","erings"],
  "ring": ["reng","rng","rring","rig","reen","ring","ringg","rins"],
  "bangles": ["bangals","bangels","bangls","bangle","bangel","bangles","bangals"],
  "makeup": ["make up","makeup","makup","makeupp","make-up"],
  "lipstick": ["lipstick","lipstik","lipstic","lipstike","lipstik"],
  "eyeshadow": ["eye shadow","eyeshadow","eye shado","eyeshado","eye shadw"],
  "laptop": ["laptp","latop","loptop","labtop","laptpp","latpop","laptoop","laptob","leptop","leptob","laptop"],
  "mobile": ["mobail","mobil","mobbile","movile","moblie","mobyle","moobile","mobaile","mobile","mobiel"],
  "phone": ["fone","phon","foone","pone","phonne","phne","phon","fonee","foon","phonn"],
  "smartphone": ["smartfone","smartphon","smartpone","smart phone","smartfon","smortphone","smart phone"],
  "tablet": ["teblet","tablit","tablett","tablat","tabelt","tablete","teblet","tablet","tablate"],
  "headphone": ["headfone","headphon","hedphone","headphn","hed phone","hedphon","hedphone","headphone"],
  "earphone": ["earfone","erphone","earphon","earfon","arphone","earphone","earfone"],
  "earbuds": ["ear buds","earbud","airbuds","air buds","earbuds","erbuds"],
  "charger": ["charjer","chargr","charjer","chargger","cherger","chargr","charger","charjer"],
  "cable": ["cabl","kable","cabel","cabble","cble","cabal","cable","kabble"],
  "speaker": ["spekar","speeker","speakar","speker","speakr","speekar","speaker","speker"],
  "camera": ["camara","camra","camear","cammera","kamera","cemera","camera","kamera"],
  "keyboard": ["keybord","keyborad","keybard","keybord","kyboard","keyboard","keybord"],
  "mouse": ["mause","mous","mowse","mos","maus","mowus","mouse","mause"],
  "monitor": ["monitr","moniter","monittor","moniotr","monetor","monitor","moniter"],
  "printer": ["printr","priner","prenter","printter","printar","printer"],
  "router": ["routr","roter","ruoter","routar","rowter","router","rooter"],
  "smartwatch": ["smart watch","smartwach","smartwotch","smartwtch","smortwatch","smartwatch","smartwatch"],
  "powerbank": ["power bank","powrbank","powarbank","powerbnk","powerbnak","power bank","powerbanc"],
  "airpod": ["airpods","airpd","arpod","airpodds","airpds","erpod","airpod","airpods"],
  "microphone": ["mic","micropone","microfon","microphone","mike","mik","microfone"],
  "tripod": ["tripd","triipod","trypod","triipod","tripod","trippod"],
  "selfie stick": ["selfi stick","selfie stic","selfy stick","selfi stic","selfie stick"],
  "ring light": ["ringlight","ring light","ring lite","ring ligh","ringlight"],
  "usb hub": ["usbhub","usb hub","usb hob","usbhob","usb hup"],
  "soldering": ["soldering","soldring","soldring","soldering","soldaring"],
  "multimeter": ["multimetr","multimeter","multimeter","multamiter"],
  "cctv": ["cctv","cctv camera","cctv cam","cc tv","cctv"],
  "wifi camera": ["wifi cam","wifi camera","wi fi cam","wifi camra","wificam"],
  "bluetooth": ["bluetooth","blutooth","bluetoth","bluethooth","bluethoth","bluetooth"],
  "wireless": ["wireless","wireles","wireles","wirelass","wireles"],
  "charging": ["charging","charging","charjing","charzing","charging"],
  "fast charging": ["fast charging","fast charg","fastcharg","fstcharging","fast charging"],
  "watch": ["wach","watsh","wotch","waach","wtach","wwatch","watche","watxh","wotch","watchh","watsch"],
  "quartz": ["quartz","quarts","quarz","quartz","kwarts","quartz"],
  "analog": ["analg","analag","annolog","anolog","enalog","analog","anolog"],
  "digital": ["digitel","digitl","digittal","digitall","dijital","digtal","digital","digitl"],
  "stainless": ["stainless","stainles","stainles","stainless","stainles"],
  "leather": ["leather","lether","lether","leathar","lether","leather"],
  "strap": ["starp","straap","strapp","stap","starp","stap","strapp"],
  "buckle": ["buckle","bucle","bukle","buckel","bucle","buckel"],
  "luminous": ["luminous","luminus","luminos","luminus","luminous","luminuos"],
  "calendar": ["calender","calander","calandar","calendr","calentar","calendar","calender"],
  "waterproof": ["waterproof","water proof","waterproff","water proof","waterprof"],
  "olevs": ["olevs","olews","olevs","olevis","olives","olevs"],
  "binbond": ["binbond","binbond","binbnd","binbond","binbnd"],
  "poedagar": ["poedagar","podagar","poedegar","poedgar","poedagar"],
  "curren": ["curren","curren","curen","curran","curren"],
  "citizen": ["citizen","citizen","citizan","citizen","sitisen"],
  "rolex": ["rolex","roleks","rolex","roleks","rolox"],
  "bedsheet": ["bed sheet","bedsheat","bedshit","bed sheat","bedshett","bedsheet","bed sheet"],
  "pillow": ["pillo","pilow","pillw","pilo","pillows","pellow","pillow","pillo"],
  "blanket": ["blankut","blankit","blankket","blanet","blankat","blancet","blanket"],
  "curtain": ["certin","curtian","curtin","curtaiin","curtein","cortain","curtain","curtan"],
  "table cloth": ["table cloth","table clth","tableclth","table clothe","table cloth"],
  "towel": ["towl","toweel","towal","towwel","toel","towil","towel"],
  "carpet": ["carpit","carpat","carpett","carept","corpet","carpet"],
  "sofa": ["sopa","sopha","sofaa","sofah","sofa","sopha"],
  "chair": ["chear","chiar","chaire","chaer","cheer","chair","chare"],
  "table": ["tabel","teble","tble","tabble","tabell","table","tabal"],
  "lamp": ["lam","lampp","lmp","laamp","lem","lamp","lampp"],
  "mirror": ["miror","mirrar","mirer","mirrror","mirer","mirror"],
  "shelf": ["shalf","shelff","shalf","sheff","shelf","shalff"],
  "drawer": ["drower","drawur","drawar","drawwer","drewer","drawer"],
  "kitchen": ["kitcen","kichen","kithen","kicthen","kitchin","kichen","kitchen"],
  "mug": ["mag","mugg","mog","muug","meug","mug","mugg"],
  "bottle": ["bottel","botl","bottl","botlle","botell","bottle","bottel"],
  "plate": ["plat","plaet","plait","plte","plait","plate","plait"],
  "bowl": ["boel","bowel","bwol","bowll","bool","bowl","bol"],
  "pan": ["paan","pann","paann","peyn","pan","paan"],
  "pot": ["pott","poot","poth","pot","pott"],
  "dispenser": ["dispenser","dispencer","dispansar","dispensar","dispenser"],
  "organizer": ["organizer","organiser","organizr","organiser","organizer"],
  "storage": ["storage","storag","storige","storage","storag"],
  "rack": ["rak","rack","racck","rac","rack"],
  "hanger": ["hanger","hangar","hnger","hangar","hanger"],
  "hook": ["huk","hook","hok","huk","hook"],
  "holder": ["holder","holdar","houlder","holder","holdar"],
  "kettle": ["kettle","ketle","ketel","kettel","ketle","kettle"],
  "mixer": ["mixer","mixar","mixer","mixar","mixer"],
  "blender": ["blender","blendar","blender","blendar","blender"],
  "grinder": ["grinder","grindar","grinder","grindar","grinder"],
  "juicer": ["juicer","juisar","juicer","juisar","juicer"],
  "chopper": ["chopper","choper","choppar","chopper","choper"],
  "knife": ["knife","knif","knyfe","knife","knif"],
  "fork": ["fork","fok","fork","fok","fork"],
  "spoon": ["spoon","spon","spoon","spon","spoon"],
  "cooker": ["cooker","cookar","cooker","cookar","cooker"],
  "frying pan": ["frying pan","fryng pan","fry pan","frypan","frying pan"],
  "pressure cooker": ["pressure cooker","presure cooker","pressurecooker","pressure cooker"],
  "microwave": ["microwave","microwve","micro wave","microwave","micro wave"],
  "oven": ["oven","ovn","oven","ovn","oven"],
  "toaster": ["toaster","toastar","toaster","toastar","toaster"],
  "dish rack": ["dish rack","dishrack","dish rak","dishrack","dish rack"],
  "egg dispenser": ["egg dispenser","eggdispencer","egg dispanser","egg dispenser"],
  "oil bottle": ["oil bottle","oil bottel","oilbottle","oil bottle"],
  "toy": ["toi","tooy","tyoy","tyo","tov","toy","toys"],
  "doll": ["dol","dool","dolle","dool","doll","dol"],
  "puzzle": ["puzle","puzzl","puzll","pozle","puzzle"],
  "robot": ["robot","roboat","robot","robott","robot"],
  "car": ["car","kar","caar","car","kar","carr"],
  "bicycle": ["bicicle","bycycle","bicycl","bycicle","bicucle","bicycle"],
  "scooter": ["scouter","scootar","skoter","skooter","scoutter","scooter"],
  "crayon": ["crayan","craion","creyon","cryon","creion","crayon"],
  "pencil": ["pensil","pencill","pencl","pensl","pencel","pencil"],
  "school bag": ["scool bag","schol bag","school beg","skool bag","school bag"],
  "baby": ["babie","babi","beby","babby","babii","baby"],
  "diaper": ["diapper","diper","diapar","dyaper","diapor","diaper"],
  "stroller": ["strollar","strolur","stoller","strolur","stroller"],
  "carrier": ["carrier","carier","carrear","carrier","carier"],
  "bouncer": ["bouncer","bouncar","bouncer","bouncar","bouncer"],
  "raincoat": ["raincoat","raincoat","raingoat","rain coat","raincoat"],
  "cashew": ["cashew","kashew","casue","kashu","cashew","kajubadam"],
  "almond": ["almond","almod","almond","amond","badam","almond","almod"],
  "mustard oil": ["mustard oil","mustard oil","musterd oil","mustardoil","mustard oil"],
  "honey": ["hony","hunny","honney","honee","honnii","honey"],
  "oats": ["oats","oats","ots","oat","oats","ot"],
  "sugar": ["suger","sugor","shugur","sugur","sugar"],
  "rice": ["rce","riice","ryce","rcie","rice"],
  "salt": ["solt","slat","saalt","slt","salt"],
  "oil": ["oyl","oul","oill","oile","oil"],
  "spice": ["spice","spise","spic","spise","spice"],
  "tea": ["tee","teea","tae","thea","tei","tea"],
  "coffee": ["coffe","coffy","cofee","cofffe","kofe","cofee","coffee"],
  "winter": ["winter","wintr","winter","wintar","winter"],
  "muffler": ["muflr","mufflar","mufler","muffller","muflar","muffler"],
  "gloves": ["gluvs","glovs","glooves","glovez","gluves","gloavs","gloves"],
  "thermal": ["thermel","thermall","thrmal","thermol","thermel","thermal"],
  "woolen": ["wolen","woolln","wulen","wulan","woolen"],
  "shawl": ["shawll","shwall","shawel","shwal","shawwl","shawl"],
  "cardigan": ["cardigun","cardgen","cardigen","cardiagn","cardighan","cardigan"],
  "gift": ["geft","gfft","guft","gifft","gfit","ghift","gift"],
  "customize": ["customise","custmize","customze","customiz","custommize","customize"],
  "personalize": ["personalise","personalze","personaliz","persoanalize","personalize"],
  "photo frame": ["foto frame","phot frame","photo fram","photoo frame","photo frame"],
  "keychain": ["key chain","keychian","keechain","keychen","keychean","keychain"],
  "mug print": ["mug prnt","mug pirnt","mug printt","mug print"],
  "tshirt print": ["t shirt print","tshirt pirnt","t-shirt print","tshirt print"],
  "card": ["kard","crd","caad","cardd","krd","card"],
  "sticker": ["stikcer","stikker","stickar","stikr","stickr","sticker"],
  "poster": ["postre","postar","postr","posterr","postor","poster"],
  "frame": ["farme","fram","fraame","frmae","frame"],
  "mystery box": ["mystery box","mysterybox","mistery box","mystery box","mysterybox"],
  "combo": ["komb","combow","comboo","combbo","koombo","combo"],
  "offer": ["offar","ofr","ofer","offerr","offr","offur","offer"],
  "discount": ["discunt","discont","discaunt","diskount","discownt","discount"],
  "black": ["blak","balck","blakc","blck","bleck","blek","black","blackk"],
  "white": ["wihte","whiet","whit","wite","whte","withe","white","whit"],
  "red": ["rade","rde","redd","raed","reed","red","redd"],
  "blue": ["bleu","bule","blu","bllue","bluu","blue","bleu"],
  "green": ["grene","gren","grean","greeen","grean","green","gren"],
  "yellow": ["yello","yelow","yellw","yelow","yelo","yellow","yello"],
  "pink": ["pnik","pinkk","pnk","penk","pek","pink","pinkk"],
  "purple": ["purpl","prupl","purpel","pruple","prupel","purple","purpel"],
  "orange": ["orang","ornge","oragne","orenge","ornge","orange","orang"],
  "grey": ["gray","gery","grrey","gry","greey","grey","gray"],
  "brown": ["bown","brwon","broun","borwn","brwon","brown","broun"],
  "navy": ["navi","navvy","navyy","naevi","navy","navy","navvy"],
  "golden": ["goden","goldn","goldan","goldeen","goldon","golden","golde"],
  "silver": ["silvr","silvar","sivler","sillver","silver","silvar"],
  "maroon": ["maron","moron","maroon","maroun","moroon","maroon","maroon"],
  "ash": ["ash","as","assh","ash","ashe","as"],
  "khaki": ["khaki","khakhi","khaki","khake","khaki","khakhi"],
  "olive": ["olive","oliv","oliv","olive","oliv","olive"],
  "small": ["smll","smal","smaal","sml","smaall","small","smal"],
  "medium": ["medim","meduim","mdium","medum","medeum","medium","medim"],
  "large": ["lrge","laarge","larg","largee","larje","large","lrg"],
  "extra large": ["xl","extra larg","extra larje","ektro large","extra large"],
  "xxl": ["xx large","double xl","doble xl","dubbol xl","xxl","double xl"],
  "nike": ["nkie","niike","nikee","nik","neke","naike","nikey","naike","nike"],
  "adidas": ["adids","addidas","adidass","adedes","addidas","adidas","adidas"],
  "puma": ["pooma","pumas","pma","puma","puma"],
  "samsung": ["samsng","samsong","samsuung","samusng","samsun","somsung","samsung"],
  "apple": ["aple","appple","appl","aplee","apel","apple","aple"],
  "xiaomi": ["xiomi","xaomi","xiamoi","xioami","siaomi","xiaomii","xiaomi"],
  "oppo": ["opo","oppoo","opoo","oppos","oppo","opo"],
  "vivo": ["vvo","vivoo","vvio","viivo","vivo"],
  "realme": ["realmi","rialme","realmee","relme","realme"],
  "walton": ["waltoon","waltan","welton","wolton","walton"],
  "symphony": ["simphony","symphny","symphoni","simfony","symphony"],
  "awei": ["awei","awey","awei","awe","awei"],
  "hoco": ["hoco","hoco","hoko","hoco","hoco"],
  "jbl": ["jbl","jbl","jbl","jbl","jbl"],
  "baseus": ["baseus","baseus","baseus","baseus","baseus"],
  "tp-link": ["tp link","tplink","tp-link","tplink","tp link"],
  "kemei": ["kemei","kemai","keme","kemei","kemei"],
  "jama": ["jama","jama","zama","jama","jama"],
  "kapor": ["kapor","kapour","kapur","kapor","kapur"],
  "gamcha": ["gamsha","gomcha","gamsa","gamcha","gomcha"],
  "tupi": ["topy","toopi","tupi","tuppi","toopi","tupy","toppee"],
  "koshai": ["kosai","koshai","kosai","koshai"],
  "goru": ["goru","goru","gour","goru"],
  "qurbani": ["kurbani","qurbani","kurbani","qurbani","kurbani"],
  "eid": ["eid","eid","eid","eid","eid"],
  "namaz": ["namaz","namaj","namaz","nomas","namaz"],
  "quran": ["quran","kuran","quran","kuran","quran"],
  "dua": ["dua","doa","dua","duwa","dua"],
  "sunnah": ["sunnah","sunna","sunnat","sunnah","sunna"],
  "tasbih": ["tasbih","tasbi","tashbih","tasbih","tashbi"],
  "jainamaz": ["jainamaz","jaynamaz","jae namaz","jainamaz","jaynamaz"],
  "qibla": ["qibla","kibla","qibla","kibla","qibla"],
  "ramadan": ["ramadan","ramzan","ramadan","ramjan","ramadan"],
  "sehri": ["sehri","seheri","sehri","sehari","sehri"],
  "iftar": ["iftar","iftar","iftar","iftar","iftar"],
  "new": ["nwe","neew","nw","neww","enw","new"],
  "best": ["bast","bset","bestt","bst","beest","best"],
  "top": ["tpp","topp","toop","tp","top"],
  "premium": ["premim","premuim","preemium","premiom","premium","premum"],
  "original": ["orignal","orijinal","originall","orignial","originel","original"],
  "branded": ["brandd","braned","brandedd","brandid","brandit","branded"],
  "free": ["fre","feree","frre","freee","friy","free"],
  "fast delivery": ["fast delivary","fast delivry","fast dlivery","fast dilivery","fast delivery"],
  "cash on delivery": ["cash on delivary","cod","c.o.d","cash delivary","cash on delivery"],
  "export quality": ["export quality","expart quality","export qlty","export quality"],
  "premium quality": ["premium quality","premium qlty","premim quality","premium quality"],
  "high quality": ["high quality","high qlty","highquality","high quality"],
  "best price": ["best price","best prise","bestprice","best price"],
};

// ════════════════════════════════════════════════════════════════════
// 🔧 LEVENSHTEIN DISTANCE
// ════════════════════════════════════════════════════════════════════
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ════════════════════════════════════════════════════════════════════
// 🔍 LOCAL SPELL CORRECT
// — dictionary match হলে corrected + matched:true
// — শুধু Levenshtein guess হলে original + matched:false
// ════════════════════════════════════════════════════════════════════
function localSpellCorrect(input: string): { word: string; matched: boolean } {
  const raw = input.toLowerCase().trim();
  if (!raw || raw.length < 2) return { word: raw, matched: false };

  // ১. exact match
  if (DICTIONARY[raw]) return { word: raw, matched: true };

  // ২. misspelling → correct word
  for (const [correct, misspellings] of Object.entries(DICTIONARY)) {
    if (misspellings.includes(raw)) return { word: correct, matched: true };
  }

  // ৩. Levenshtein — শুধু score করে, কিন্তু "matched" নেই
  //    original ফেরত দাও যাতে user-এর জন্য ভুল correction না হয়
  return { word: raw, matched: false };
}

// ════════════════════════════════════════════════════════════════════
// 🔍 NORMALIZE + CORRECT QUERY
// ════════════════════════════════════════════════════════════════════
function normalizeQuery(input: string): string {
  const hasBengali = /[\u0980-\u09FF]/.test(input);
  if (hasBengali) {
    return transliterateBengali(input);
  }
  return input;
}

function correctQuery(input: string): { query: string; wasChanged: boolean } {
  const normalized = normalizeQuery(input);
  const words = normalized.trim().split(/\s+/);

  let anyChanged = false;
  const correctedWords = words.map(word => {
    const { word: corrected, matched } = localSpellCorrect(word);
    if (matched && corrected !== word) anyChanged = true;
    // match না হলে original word-ই রাখো — Levenshtein guess বাদ দাও
    return matched ? corrected : word;
  });

  return { query: correctedWords.join(" "), wasChanged: anyChanged };
}

// ─── DEBOUNCE HOOK ──────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── TYPING PLACEHOLDER ────────────────────────────────────────────
const PLACEHOLDER_TERMS = [
  "গেঞ্জি...",
  "shirt...",
  "জুতা...",
  "sneaker...",
  "ঘড়ি...",
  "watch...",
  "ব্যাগ...",
  "laptop...",
];

function useTypingPlaceholder(
  terms: string[],
  typingSpeed = 80,
  pauseMs = 1400,
  deletingSpeed = 40
) {
  const [placeholder, setPlaceholder] = useState("Search products...");
  const termIdx = useRef(0);
  const charIdx = useRef(0);
  const deleting = useRef(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = terms[termIdx.current];
      if (!deleting.current) {
        charIdx.current += 1;
        setPlaceholder("Search: " + current.slice(0, charIdx.current));
        if (charIdx.current === current.length) {
          deleting.current = true;
          timeout = setTimeout(tick, pauseMs);
          return;
        }
      } else {
        charIdx.current -= 1;
        setPlaceholder("Search: " + current.slice(0, charIdx.current));
        if (charIdx.current === 0) {
          deleting.current = false;
          termIdx.current = (termIdx.current + 1) % terms.length;
        }
      }
      timeout = setTimeout(tick, deleting.current ? deletingSpeed : typingSpeed);
    };
    timeout = setTimeout(tick, typingSpeed);
    return () => clearTimeout(timeout);
  }, [terms, typingSpeed, pauseMs, deletingSpeed]);

  return placeholder;
}

// ─── SEARCH HISTORY CACHE ──────────────────────────────────────────
const HISTORY_KEY = "search_history";
const MAX_HISTORY = 12;

function getHistory(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(history: string[]) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────
export default function Shop() {
  const { dark } = useTheme();
  const typingPlaceholder = useTypingPlaceholder(PLACEHOLDER_TERMS);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [correctedFrom, setCorrectedFrom] = useState<string | null>(null);

  const [category, setCategory] = useState("all");
  const [sortBy] = useState("default");
  const [categories, setCategories] = useState<string[]>(["all"]);

  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(getHistory);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownIndex, setDropdownIndex] = useState(-1);

  const debouncedSearch = useDebounce(searchInput, 800);
  const loaderRef = useRef<HTMLDivElement>(null);
  const isFetching = useRef(false);

  // ─── CLICK OUTSIDE ───────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setDropdownIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── FETCH CATEGORIES ─────────────────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/shopdata/categories`, { headers: HEADERS });
        if (res.ok) {
          const data = await res.json();
          if (data?.categories) setCategories(["all", ...data.categories]);
        }
      } catch (err) {
        console.error("Categories fetch failed:", err);
      }
    };
    fetchCategories();
  }, []);

  // ─── DEBOUNCE → SPELL CORRECT → SEARCH ───────────────────────────
  useEffect(() => {
    const trimmed = debouncedSearch.trim();

    if (!trimmed) {
      setActiveSearch("");
      setCorrectedFrom(null);
      return;
    }

    if (trimmed.length < 2) {
      setActiveSearch(trimmed);
      setCorrectedFrom(null);
      return;
    }

    const hasBengali = /[\u0980-\u09FF]/.test(trimmed);
    const { query: corrected, wasChanged } = correctQuery(trimmed);

    console.log(`🔍 "${trimmed}" → "${corrected}" (changed: ${wasChanged})`);

    if (wasChanged) {
      // dictionary-te match পাওয়া গেছে — corrected দিয়ে search + notice দেখাও
      setCorrectedFrom(hasBengali ? `"${trimmed}" → "${corrected}"` : trimmed);
      setActiveSearch(corrected);
    } else {
      // কোনো confident match নেই — original দিয়েই search, কোনো notice নেই
      setCorrectedFrom(null);
      setActiveSearch(corrected); // corrected === trimmed এখানে
    }

    addToHistory(trimmed);
  }, [debouncedSearch]);

  // ─── ADD TO HISTORY ───────────────────────────────────────────────
  function addToHistory(term: string) {
    const trimmed = term.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return;
    setSearchHistory((prev) => {
      const next = [trimmed, ...prev.filter((t) => t !== trimmed)].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  }

  // ─── REMOVE SINGLE HISTORY ITEM ──────────────────────────────────
  function removeHistoryItem(term: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const next = prev.filter((t) => t !== term);
      saveHistory(next);
      return next;
    });
  }

  // ─── CLEAR ALL HISTORY ───────────────────────────────────────────
  function clearAllHistory(e: React.MouseEvent) {
    e.stopPropagation();
    setSearchHistory([]);
    saveHistory([]);
  }

  // ─── APPLY SUGGESTION ────────────────────────────────────────────
  function applySuggestion(term: string) {
    const { query: corrected } = correctQuery(term);
    setSearchInput(corrected);
    setActiveSearch(corrected);
    setCorrectedFrom(null);
    setShowDropdown(false);
    setDropdownIndex(-1);
    addToHistory(term);
    inputRef.current?.blur();
  }

  // ─── KEYBOARD NAVIGATION ─────────────────────────────────────────
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const suggestions = getDropdownItems();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDropdownIndex((i) => Math.min(i + 1, suggestions.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setDropdownIndex((i) => Math.max(i - 1, -1));
      return;
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
      setDropdownIndex(-1);
      return;
    }
    if (e.key === "Enter") {
      if (dropdownIndex >= 0 && suggestions[dropdownIndex]) {
        applySuggestion(suggestions[dropdownIndex].term);
        return;
      }
      const trimmed = searchInput.trim();
      if (trimmed) {
        const { query: corrected, wasChanged } = correctQuery(trimmed);
        setActiveSearch(corrected);
        if (wasChanged) {
          setSearchInput(corrected);
          setCorrectedFrom(trimmed);
        }
        addToHistory(trimmed);
        setShowDropdown(false);
      }
    }
  }

  // ─── DROPDOWN ITEMS ───────────────────────────────────────────────
  function getDropdownItems() {
    const q = searchInput.trim().toLowerCase();

    if (!q) {
      const historyItems = searchHistory.map((t) => ({ term: t, type: "history" as const }));
      const trendingItems = TRENDING_SEARCHES
        .filter((t) => !searchHistory.includes(t))
        .slice(0, 6)
        .map((t) => ({ term: t, type: "trending" as const }));
      return [...historyItems, ...trendingItems];
    }

    const historyMatches = searchHistory
      .filter((t) => t.includes(q) && t !== q)
      .slice(0, 5)
      .map((t) => ({ term: t, type: "history" as const }));

    const dictMatches = Object.keys(DICTIONARY)
      .filter((k) => k.startsWith(q) && !searchHistory.includes(k) && k !== q)
      .slice(0, 5)
      .map((t) => ({ term: t, type: "suggestion" as const }));

    return [...historyMatches, ...dictMatches];
  }

  // ─── FETCH PRODUCTS ───────────────────────────────────────────────
  const fetchProducts = useCallback(
    async (pageNum: number, reset = false) => {
      if (isFetching.current) return;
      isFetching.current = true;

      if (reset) setLoading(true);
      else setLoadingMore(true);

      try {
        let url: string;

        if (activeSearch) {
          const params = new URLSearchParams({
            q: activeSearch,
            page: String(pageNum),
            limit: String(PAGE_SIZE),
            sort: sortBy,
          });
          if (category !== "all") params.append("category", category);
          url = `${API_BASE}/shopdata/search?${params}`;
        } else {
          const params = new URLSearchParams({
            page: String(pageNum),
            limit: String(PAGE_SIZE),
            sort: sortBy,
          });
          if (category !== "all") params.append("category", category);
          url = `${API_BASE}/shopdata?${params}`;
        }

        const res = await fetch(url, { headers: HEADERS });

        if (res.status === 401) {
          toast.error("API Key invalid!");
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const productList = data?.products || [];
        const totalCount = data?.total || 0;
        const more = data?.hasMore || false;

        if (reset) setProducts(productList);
        else setProducts((prev) => [...prev, ...productList]);

        setHasMore(more);
        setTotal(totalCount);
        setPage(pageNum);
      } catch (err) {
        console.error("Fetch failed:", err);
        toast.error("প্রোডাক্ট লোড করতে সমস্যা হয়েছে");
        if (reset) {
          setProducts([]);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetching.current = false;
      }
    },
    [activeSearch, category, sortBy]
  );

  useEffect(() => {
    if (activeSearch !== undefined) {
      fetchProducts(1, true);
    }
  }, [fetchProducts, activeSearch]);

  // ─── INFINITE SCROLL ─────────────────────────────────────────────
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchProducts(page + 1, false);
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchProducts]);

  // ─── CLEAR SEARCH ────────────────────────────────────────────────
  function clearSearch() {
    setSearchInput("");
    setActiveSearch("");
    setCorrectedFrom(null);
    setShowDropdown(false);
    setDropdownIndex(-1);
    inputRef.current?.focus();
  }

  const dropdownItems = showDropdown ? getDropdownItems() : [];

  // ─── RENDER ────────────────────────────────────────────────────────
  return (
    <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 min-h-screen">
      <Helmet>
        <title>ONE-SHOP — Premium E-Commerce</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Our{" "}
              <span className="gradient-text font-display italic">Shop</span>
            </h1>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div
            className={`p-3 sm:p-4 rounded-2xl mb-6 sm:mb-8 ${
              dark
                ? "bg-white/[0.03] border border-white/5"
                : "bg-white border border-gray-200"
            }`}
          >
            {/* ─── Search input + dropdown ─── */}
            <div className="relative flex-1" ref={searchRef}>
              <Search
                size={15}
                className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 ${
                  dark ? "text-gray-500" : "text-gray-400"
                }`}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder={typingPlaceholder}
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setCorrectedFrom(null);
                  setShowDropdown(true);
                  setDropdownIndex(-1);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                className={`w-full pl-9 sm:pl-11 pr-8 py-2.5 sm:py-3 rounded-xl text-sm outline-none transition-all ${
                  dark
                    ? "bg-white/5 border border-white/10 focus:border-violet-500/50 text-white"
                    : "bg-gray-50 border border-gray-200 focus:border-violet-400 text-gray-900"
                } ${showDropdown && dropdownItems.length > 0 ? "rounded-b-none" : ""}`}
              />
              {searchInput && (
                <button
                  onClick={clearSearch}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 ${
                    dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <X size={14} />
                </button>
              )}

              {/* ─── DROPDOWN ─── */}
              {showDropdown && dropdownItems.length > 0 && (
                <div
                  className={`absolute left-0 right-0 top-full z-50 rounded-b-xl overflow-hidden border-t-0 shadow-xl ${
                    dark
                      ? "bg-gray-900 border border-white/10 border-t-0"
                      : "bg-white border border-gray-200 border-t-0"
                  }`}
                >
                  {!searchInput.trim() && (
                    <div className={`flex items-center justify-between px-3 pt-2 pb-1 ${dark ? "text-gray-600" : "text-gray-400"}`}>
                      <span className="text-[11px] font-medium uppercase tracking-wider">
                        {searchHistory.length > 0 ? "Recent & Trending" : "Trending"}
                      </span>
                      {searchHistory.length > 0 && (
                        <button
                          onClick={clearAllHistory}
                          className={`text-[11px] transition-colors ${
                            dark ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  )}

                  <ul>
                    {dropdownItems.map((item, i) => (
                      <li key={item.term}>
                        <div
                          className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                            i === dropdownIndex
                              ? dark
                                ? "bg-white/10"
                                : "bg-violet-50"
                              : dark
                              ? "hover:bg-white/5"
                              : "hover:bg-gray-50"
                          }`}
                          onMouseDown={() => applySuggestion(item.term)}
                          onMouseEnter={() => setDropdownIndex(i)}
                        >
                          {item.type === "history" ? (
                            <Clock
                              size={13}
                              className={dark ? "text-gray-600" : "text-gray-400"}
                            />
                          ) : item.type === "trending" ? (
                            <TrendingUp
                              size={13}
                              className={dark ? "text-violet-500" : "text-violet-400"}
                            />
                          ) : (
                            <Search
                              size={13}
                              className={dark ? "text-gray-600" : "text-gray-400"}
                            />
                          )}

                          <span className={`flex-1 text-sm ${dark ? "text-gray-300" : "text-gray-700"}`}>
                            {searchInput.trim() ? (
                              <>
                                <span className={dark ? "text-white font-medium" : "text-gray-900 font-medium"}>
                                  {item.term.slice(0, searchInput.trim().length)}
                                </span>
                                {item.term.slice(searchInput.trim().length)}
                              </>
                            ) : (
                              item.term
                            )}
                          </span>

                          {item.type === "history" && (
                            <button
                              onMouseDown={(e) => removeHistoryItem(item.term, e)}
                              className={`p-1 rounded transition-colors ${
                                dark ? "text-gray-700 hover:text-gray-400" : "text-gray-300 hover:text-gray-500"
                              }`}
                            >
                              <X size={11} />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>

                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowDropdown(false);
                    }}
                    className={`w-full flex items-center justify-center py-1.5 transition-colors ${
                      dark
                        ? "text-gray-700 hover:text-gray-500 border-t border-white/5"
                        : "text-gray-300 hover:text-gray-500 border-t border-gray-100"
                    }`}
                  >
                    <ChevronUp size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* ✅ Auto-corrected notice — শুধু dictionary match হলেই দেখাবে */}
            {correctedFrom && activeSearch && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>
                  ✏️ &quot;{correctedFrom}&quot; → &quot;{activeSearch}&quot; automatically corrected
                </span>
              </div>
            )}

            {/* Category buttons */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-medium capitalize transition-all duration-300 ${
                    category === cat
                      ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20"
                      : dark
                      ? "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat === "all" ? "All Products" : cat}
                </button>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`h-52 sm:h-64 rounded-2xl animate-pulse ${
                  dark ? "bg-white/[0.03]" : "bg-gray-100"
                }`}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className={`text-base font-medium ${dark ? "text-gray-400" : "text-gray-500"}`}>
              &quot;{activeSearch || searchInput}&quot; পাওয়া গেলো না
            </p>
          </div>
        ) : (
          <>
            <p className={`text-xs sm:text-sm mb-4 ${dark ? "text-gray-500" : "text-gray-500"}`}>
              {activeSearch
                ? `"${activeSearch}" — ${total}টি product পাওয়া গেছে`
                : `Showing ${products.length} of ${total} products`}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              {products.map((product, i) => (
                <ProductCard
                  key={product._id || product.id || i}
                  product={product}
                  index={i}
                />
              ))}
            </div>

            <div ref={loaderRef} className="h-10 mt-6 flex items-center justify-center">
              {loadingMore && (
                <div className="flex gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        dark ? "bg-violet-400" : "bg-violet-500"
                      }`}
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}