/**
 * Draught outlets: the 229 outlets from Outets_to_Surveyed.xlsx (Sheet1).
 *
 * Add this as a second file next to Survey.gs (Apps Script editor, + next to
 * Files, Script, name it Outlets). Save, pick loadDraughtOutlets in the
 * function list and press Run.
 *
 * It fills two tabs and can be run again safely:
 *  - National Outlet: Account ID, Account, Parent territory, Territory, Area.
 *    The app looks outlet IDs up here and fills in the name and territory.
 *  - Outlets: the same outlets as active, so they show in the admin console.
 */
var DRAUGHT_OUTLETS = [
  ["1202045", "Haykoch Lounge", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1127958", "Maedot Bar & restorant", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1003431", "Benazo Lounge", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1756846", "Be Enat Elfegn Butchery", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1067597", "Mira Butchery & Kitfo", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1062558", "Watot Hotel", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1027080", "Zebasil Bar and Restaurant", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1003432", "Zemen Lounge", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1584297", "Antex bar", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1003008", "Salayesh  Bar&Restorant", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1027106", "Ashu Butchery", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["2967819", "Yetam Butchery", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1118070", "Bridge Lounge", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1048221", "Fikre Kunspagna Lebu", "Yigeremu-Kirkos", "Lebu 1", "Lebu"],
  ["1001404", "Fisha Grocery @Total", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["2963298", "Keren Hotel", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1574564", "40 Minch Bar And Restaurant @Total", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1002065", "Niguse Hotel", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1001403", "Biruk Bar And Restaurant", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["2962640", "Mastawol Hotel", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1002149", "Welde Bar and Restaurant", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1091921", "Yohannes Hotel Kality Total", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1001203", "Asegedech Hotel", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1001202", "Abem @Kaliti Total", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1001798", "Workalemahu Hotel Kaliti Total", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1561241", "Fantahun Grocery Kaliti Total", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["2962517", "Abel Grocery", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["2280989", "Wema Bar&Res @total E", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1001385", "Betenda Liyu Kurt And Kitfo Kaliti Total", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["2967097", "Nacros Butcher", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1001387", "Bartina Hotel Kality Total", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["2282787", "Kasa Grocery Kaliti Total", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1001399", "Crstina Bar and Restaurant@ Kaliti", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["1858932", "Sikab Bar And Resturant", "Shimeles-Akaki Kality", "Kality Total", "Kality"],
  ["2966288", "Betelehem Feyel Bet", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["2394992", "Tinsaye Grocery (Ayat", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["1000484", "Medhanialem Grocery (Tsebel)", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["1000498", "Nati Bar and Restaurant ( Ayat)", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["2965410", "Ahadu Bar And Restaurant", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["2757790", "Biruk Kurt Ena Kitfo", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["1163803", "Girma Liyu Kurt", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["1225868", "Zequala Kitfo Bet", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["2964747", "Abaye Bar And Restaurant", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["2964649", "Genet Mig Bet", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["2883378", "Eyerus Bar And Restaurant", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["2344355", "Meba Grocery/Mekedonia/", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["2812174", "Selam Grocery / Tseble", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["2888215", "Dames Kurt Ena Kitfo", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["2716057", "Hailu Bar & Resturant", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["2675040", "Sitota Buchery", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["1233135", "Lemore Bar And Restaurant", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["1090447", "Agape Bar and Restaurant", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["1057633", "Mera Bar and Restaurant", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["2963851", "Beteseb Bar And Restaurant", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["1593192", "Bekibir Bar And Restaurant", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["1000495", "Beshilo Bar and Restaurant (Ayat)", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["1659603", "Birrader Bar And Restaurant", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["1066138", "Kebede Bar and Restaurant", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["1200753", "Nakeros Bar", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["1000499", "Desi Bar and Restaurant(ayat)", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["2712369", "Mekdy Grocery(ayat Tsbel)", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["2749698", "Gech Grocery( Ayat Tsebel)", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["1216105", "Bekele Butchery ( ayat )", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["2969355", "Andinet Liyu Kurt Ena Kitfo (2)", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["1127393", "Kana Bar & Restaurant(ayat)", "Guade-Yeka", "Ayat Condominium", "Ayat"],
  ["2389612", "Joni Bar & restaurant (Tsebel)", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["2966289", "Vision Jambo House", "Guade-Yeka", "Ayat 2", "Ayat"],
  ["1572352", "Peak Resto Bar", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1678582", "Family Bar and Restaurant", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["2966430", "May Kibwa Bar & Restaurant", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1232571", "Homies Bar and Restaurant", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["2966008", "Feven Shiro", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1128749", "Haset Restaurant", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["2694830", "Bitu Bar And Restaurant (Feyelbet)", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1575767", "Lehulu Bar And Restaurant", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1561093", "Green Mamesha Grocery and Stock", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["2275488", "Quick Sip Bar& Restaurant (Feyelbet)", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1562510", "Enate Restaurant Fiyelbet", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["2953326", "Amen Grocery (feylbet)", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["2906158", "Mesklega Butcher", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2495983", "Hundaf Bar And Restaurant no3", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2730033", "Yemechen No2 fiyel Bet", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2608618", "Lexury Winner Fiyel Bet", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2947304", "Noble Plate Restaurant", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2933406", "Enemay Bar And Restaurant", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2931271", "70 Derja Restaurant &loung", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2939638", "Gezana Restaurant", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2910023", "Gach Fresh Fish House", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2965017", "Tadese Fish", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2725111", "Kidanemihret Hotel&sega Bet", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["1579550", "Bricks Lounge &resturant", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2123024", "Hop Lounge & Restaurant", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2254017", "Fikere Kunspagna Fiyel Bet", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2960696", "Zeqala Butchery", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2326122", "Rediat Special Fiyel(safari)M", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1210219", "Gelila Grocery(safari M)", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1060212", "Shewit Shiro Bet(fyel Bet) M", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1014726", "Camfina Bar and Restaurant", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1613091", "Haletawuha Kurt Bet(fyel Bet)", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["2960374", "Mkop Bar& Restaurant", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["2936101", "Global Kurt & Lounge", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1641923", "Sami Bar And Restaurant(Feyel Bet)", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1133175", "Peace Addis Lounge (feyel Bet)", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["1092998", "Sarem Kitfo Bet(fyel Bet)", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["2845807", "Shi80 Fiyel Kurt & Tibes", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2003128", "We Care Liyu Kurt(fyel Bet)", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["1567781", "Cheru Medihen Kurt &kitfo", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2196866", "Yonas Churchere Butchery No3 Fiyel", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2938660", "L Classic Lounge", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2837203", "Zegeye Kurti And Lounge", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["2951769", "Yebet Ketfo", "Fibath-Bole", "CMC", "Fiyelbet"],
  ["1565877", "Tiktok Bekel Fiyel Bet", "Guade-Yeka", "Ayat 1", "Fiyelbet"],
  ["2942456", "Yosra Lounge", "Genet-Kolfe Keranyo", "Betel - Weyra Sefer", "Torhayloch"],
  ["2400336", "Evana Hotel", "Genet-Kolfe Keranyo", "Betel - Weyra Sefer", "Torhayloch"],
  ["1009121", "Foyat Hotel", "Genet-Kolfe Keranyo", "Betel - Weyra Sefer", "Torhayloch"],
  ["1009338", "Sheger Hotel Torhailoch", "Genet-Kolfe Keranyo", "Betel - Weyra Sefer", "Torhayloch"],
  ["1133405", "Sawi Hotel", "Genet-Kolfe Keranyo", "Betel - Weyra Sefer", "Torhayloch"],
  ["1009339", "Markon Hotel", "Genet-Kolfe Keranyo", "Betel - Weyra Sefer", "Torhayloch"],
  ["1212593", "Tanab Hotel", "Genet-Kolfe Keranyo", "Betel - Weyra Sefer", "Torhayloch"],
  ["1225952", "Yodat Hotel", "Genet-Kolfe Keranyo", "Betel - Weyra Sefer", "Torhayloch"],
  ["1009510", "Mera Ado Hotel", "Genet-Kolfe Keranyo", "Betel - Weyra Sefer", "Torhayloch"],
  ["2946974", "Absalat Konspagna Torhailoch", "Genet-Kolfe Keranyo", "Betel - Weyra Sefer", "Torhayloch"],
  ["1008946", "Teles  Bar and Restaurant", "Genet-Kolfe Keranyo", "Betel - Weyra Sefer", "Torhayloch"],
  ["1009120", "K/K Wereda 09 Beza Shemachoch", "Genet-Kolfe Keranyo", "Betel - Weyra Sefer", "Torhayloch"],
  ["2965772", "Buna Wuga Bar and Resturant", "DA-Gullele", "Megenagna 2", "Megenagna"],
  ["1041417", "Hosaena Erase Hotel", "DA-Gullele", "Megenagna 2", "Megenagna"],
  ["1633255", "Ze Bridge Bar and Restaurant", "DA-Gullele", "Megenagna 2", "Megenagna"],
  ["2797711", "Buna Wuga Bar and Restorant", "DA-Gullele", "Megenagna 2", "Megenagna"],
  ["1000097", "Sentayehu Grocery", "DA-Gullele", "Megenagna 2", "Megenagna"],
  ["1000089", "Messob Habesha Bucher", "DA-Gullele", "Megenagna 2", "Megenagna"],
  ["2962815", "Hosena Hotal", "DA-Gullele", "Zefmesh", "Megenagna"],
  ["1237517", "Tesema Shenkora Buchery", "DA-Gullele", "Zefmesh", "Megenagna"],
  ["1000088", "Chemna Bar & Restaurant", "DA-Gullele", "Megenagna 2", "Megenagna"],
  ["1000105", "Leterm Bar and Restaurant", "DA-Gullele", "Zefmesh", "Megenagna"],
  ["1000103", "Kare Hotal", "DA-Gullele", "Zefmesh", "Megenagna"],
  ["1569268", "Elfign Cafe & Restaurant", "DA-Gullele", "Megenagna 2", "Megenagna"],
  ["1055469", "Betenda Kitefo Bet", "DA-Gullele", "Zefmesh", "Megenagna"],
  ["1235470", "Sifen Bar and Restaurant. Megenagna 2", "DA-Gullele", "Megenagna 2", "Megenagna"],
  ["1000104", "Shakach  Bar and Res(Megenaga)", "DA-Gullele", "Zefmesh", "Megenagna"],
  ["2968666", "Wendimamach Yeguraga Kurt Ktfo", "DA-Gullele", "Megenagna 2", "Megenagna"],
  ["2965773", "Konjit Grocery", "DA-Gullele", "Megenagna 2", "Megenagna"],
  ["2884024", "Kembon Bar & Restaurant", "Fibath-Bole", "Korean Hospital", "Gerji"],
  ["2965520", "We Care Buchery", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1000074", "Ezoboni Bar and  Restaurant", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["2887412", "Majet Bar and Restaurant(gerji)", "Fibath-Bole", "Korean Hospital", "Gerji"],
  ["2842418", "Fine Scoch Grocery", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1215982", "Kertina Addis Bar and Restaurant/Korean", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1000049", "Mig- Bar Bar and Restaurant", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["2305249", "Asni Migb Bet(Gerji)", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1001647", "Gojo Bar and Restaurant(Gerji)", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1001657", "Wendimamachoche Grocery(Gerji)", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1001652", "Kertina Bar and Restaurant(Gerji T )", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["2963450", "Diva Addis Lougy", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1003269", "Kero Yegurage Kitefo Bet (Gerji)", "Fibath-Bole", "Sunshine Condominium", "Gerji"],
  ["1003266", "Alex Grocery", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1003267", "Triple Bar and Restaurant (Gerji)", "Fibath-Bole", "Sunshine Condominium", "Gerji"],
  ["1003231", "Mulu Grocery", "Fibath-Bole", "Sunshine Condominium", "Gerji"],
  ["1618815", "ATM Bar And Restaurant", "Fibath-Bole", "Sunshine Condominium", "Gerji"],
  ["1003229", "Betena  Bar and Restaurant (Gerji)", "Fibath-Bole", "Sunshine Condominium", "Gerji"],
  ["1001644", "Chivas Butchery (Gerji)", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1212527", "City Bar & Restorant", "Fibath-Bole", "Korean Hospital", "Gerji"],
  ["1572471", "Fiker Grocery(gerji taxi tera)", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1001648", "Befrehot  Grocery", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1001643", "Debot  Bar And Restaurant (Gerji)", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1001649", "Ashu Bar and Restaurant (Gerji)", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["1000019", "Shebel  Addis Bar and Restaurant (Gerji)", "Fibath-Bole", "Bole Homes", "Gerji"],
  ["2945449", "Fikru Grocery(gerji)", "Fibath-Bole", "Sunshine Condominium", "Gerji"],
  ["2785966", "Zegeye Bar&restaurant", "Dawileon-Nefas Silk Lafto", "Bole Rwanda", "Bole 1"],
  ["2841712", "Yonas Chercher No4", "Dawileon-Nefas Silk Lafto", "Bole Rwanda", "Bole 1"],
  ["2948842", "Corner Lounge", "Dawileon-Nefas Silk Lafto", "Bole Rwanda", "Bole 1"],
  ["2729788", "Romanat Hotel", "Dawileon-Nefas Silk Lafto", "Bole Rwanda", "Bole 1"],
  ["1024855", "Habesha Kurt &restaurant", "Dawileon-Nefas Silk Lafto", "Bole Rwanda", "Bole 1"],
  ["2934522", "Megenega Fiyel Bete", "Dawileon-Nefas Silk Lafto", "Bole Rwanda", "Bole 2"],
  ["2968141", "Andualem Kurs Bet", "Dawileon-Nefas Silk Lafto", "Wollo Sefer", "Bole 2"],
  ["2753806", "Bazera Bar&restaurant", "Dawileon-Nefas Silk Lafto", "Wollo Sefer", "Bole 2"],
  ["2968050", "Chanoly Carnivore", "Dawileon-Nefas Silk Lafto", "Wollo Sefer", "Bole 2"],
  ["1023776", "Sami Wendemamachoch Butchery", "Dawileon-Nefas Silk Lafto", "Bole Rwanda", "Bole 2"],
  ["1004247", "Wondye Chenbelala Bar and Restaurant", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["2964124", "Adme Grocery", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1003950", "Chembelala Bar and Restaurant", "Shimeles-Akaki Kality", "Kadisco", "Saris Adey Abeba"],
  ["1000063", "Sahilu Bar and Restaurant", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["2964078", "Adey Abeba Grocery", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1004245", "Dahlak Bar and Restaurant", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1004244", "Arada Bar& Restaurant", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1002044", "Habesha Bar and Restaurant @Adeyabeba", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1006810", "Askale Bar and Restaurant", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1000046", "Wedeb Bar and Restaurant", "Shimeles-Akaki Kality", "Kadisco", "Saris Adey Abeba"],
  ["2272331", "Dagemawi I Cos B&Restaurant", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1006816", "Genet Restaurant Adye Abeba", "Shimeles-Akaki Kality", "Kadisco", "Saris Adey Abeba"],
  ["1234250", "Des 9 Bar & Restaurant", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1000098", "Aberus Bar and Restaurant@ Adye Abeba", "Shimeles-Akaki Kality", "Kadisco", "Saris Adey Abeba"],
  ["2963844", "Sador Bar And Resturant", "Shimeles-Akaki Kality", "Kadisco", "Saris Adey Abeba"],
  ["2963795", "Ayalew Bar And Resturant", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["2963842", "Fkir Grocery", "Shimeles-Akaki Kality", "Kadisco", "Saris Adey Abeba"],
  ["1215867", "Elelta Bar and Restaurant Adey Abeba", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["2963779", "Sara Grocery", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1000064", "Tina 2 Bar and Restaurant", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1645911", "Yod Abiysinna", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["2963694", "Merkeb Grocery", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1002049", "Liya Hotel", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1002056", "Filagot Bar and Restaurant", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1039556", "Mintesinot Butchery", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["1127215", "Kiya Grocery", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["2768367", "Arsema Grocery", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["2963473", "Dire Kurs Bet", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1057642", "Befrehot Hotel", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["2963417", "Yohana Hotel", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["2963410", "Meda Grocery", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1215311", "Miki Grocery", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["1004074", "Mechal Hotel", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["1002062", "Sokem Hotel", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["2962721", "Best Grocery", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["2406122", "Yod Ethiopia", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["1004073", "Connection Bar", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["1002057", "Beyene Leda Hotel", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1002058", "Mesoya Hotel", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["1000052", "Ananiya Hotel", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1002053", "Saris Fish and Kitfo Bet", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1002051", "Yilma Yideg Hotel", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["1002025", "Wabi Hotel", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["1002033", "Snoze Hotel", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1002031", "Bridge Hotel", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1041499", "Dashen Pension", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["1580583", "Megenaga getocery", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["1000024", "Veronica Bar And Restaurant", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1020317", "Flamingo Bar and Restaurant", "Shimeles-Akaki Kality", "Saris", "Saris Adey Abeba"],
  ["2969198", "Selemon Grocery", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["2969159", "Shewit Shiro Bet", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"],
  ["1215153", "Betsegaw Bar and Restaurant", "Shimeles-Akaki Kality", "Adey Ababa", "Saris Adey Abeba"]
];

function loadDraughtOutlets() {
  var ss = ss_();

  // National Outlet tab, replaced in full
  var nat = ss.getSheetByName(NATIONAL_SHEET) || ss.insertSheet(NATIONAL_SHEET);
  nat.clearContents();
  var natRows = [['Account ID', 'Account', 'Parent territory', 'Territory', 'Area']].concat(DRAUGHT_OUTLETS);
  nat.getRange(1, 1, natRows.length, 5).setNumberFormat('@').setValues(natRows);
  nat.getRange(1, 1, 1, 5).setFontWeight('bold');
  nat.setFrozenRows(1);

  // Outlets tab: add any outlet not already there, as active
  var added = 0;
  withLock_(function () {
    var sheet = sheet_(OUTLETS_SHEET);
    var headers = headers_(sheet);
    var have = {};
    readRows_(OUTLETS_SHEET, 0).forEach(function (o) { have[normId_(o.outletId)] = true; });
    var fresh = [];
    DRAUGHT_OUTLETS.forEach(function (r) {
      var id = normId_(r[0]);
      if (have[id]) return;
      have[id] = true;
      var o = { key: 'OUT-' + Utilities.getUuid().slice(0, 8).toUpperCase(), outletId: id, outletName: r[1], status: 'active', createdAt: now_(), updatedAt: now_() };
      fresh.push(headers.map(function (h) { return Object.prototype.hasOwnProperty.call(o, h) ? o[h] : ''; }));
    });
    if (fresh.length) {
      var start = sheet.getLastRow() + 1;
      sheet.getRange(start, 1, fresh.length, headers.length).setNumberFormat('@').setValues(fresh);
    }
    added = fresh.length;
    bumpOutlets_();
  });

  // Forget earlier "not found" lookups so the IDs work straight away
  var cache = CacheService.getScriptCache();
  var keys = DRAUGHT_OUTLETS.map(function (r) { return 'nat_' + normId_(r[0]); });
  for (var i = 0; i < keys.length; i += 100) cache.removeAll(keys.slice(i, i + 100));
  cache.remove('divisions_v1');

  Logger.log('National Outlet: ' + DRAUGHT_OUTLETS.length + ' outlets. Outlets tab: ' + added + ' added.');
}
