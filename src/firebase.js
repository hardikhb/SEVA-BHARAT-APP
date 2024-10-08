import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore, getDoc, doc, updateDoc, getDocs, collection, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword,GoogleAuthProvider, signInWithEmailAndPassword, sendEmailVerification, signOut,signInWithPopup ,OAuthProvider} from "firebase/auth";
import { generatePassword, randomNumber } from './modules/random';

const firebaseConfig = {
    // apiKey: "AIzaSyCOpArtYL2kncWFHx4YSzQPnmk0w4HrxEs",
    // authDomain: "do-nation-web.firebaseapp.com",
    // projectId: "do-nation-web",
    // storageBucket: "do-nation-web.appspot.com",
    // messagingSenderId: "882359419027",
    // appId: "1:882359419027:web:22634e4c2aef1ca5860d66",
    // measurementId: "G-0B8BZ62THE"
    // apiKey: "AIzaSyAEt7tZABVoFt-leKJSrUl60AQumkbz2gw",
    // authDomain: "react-app-acb87.firebaseapp.com",
    // projectId:  "react-app-acb87",
    // storageBucket:  "react-app-acb87.appspot.com",
    // messagingSenderId: "688052325658",
    // appId: "1:688052325658:web:03e28b29fb4542125e70a3",
    // measurementId: "G-PMBSWFFF5J"
    apiKey: "AIzaSyA4uyKJNnYLtyC8HXH46a4wLnnjhWvsogk",
    authDomain: "pc-07-6bcd6.firebaseapp.com",
    projectId: "pc-07-6bcd6",
    storageBucket: "pc-07-6bcd6.appspot.com",
    messagingSenderId: "1058372370907",
    appId: "1:1058372370907:web:e77673ab50ebfd6ed9a7fe",
    measurementId: "G-NM66CDFY61"
};

// Initialising app
const app = initializeApp(firebaseConfig);
getAnalytics(app)

// Initialising services
const db = getFirestore(app);
export const auth = getAuth()
const provider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

export async function signupUser(email, password) {
    try {
        localStorage.setItem('auth-type', 'user')
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await sendEmailVerification(userCredential.user);
        return { success: true }
    } catch (error) {
        localStorage.removeItem('auth-type')
        return { success: false, error: error.code || 'Some error occured...' }
    }
}

export async function loginUser(email, password) {
    try {
        localStorage.setItem('auth-type', 'user')
        await signInWithEmailAndPassword(auth, email, password)
        return { success: true }
    } catch (error) {
        localStorage.removeItem('auth-type')
        return { success: false, error: error.code || 'Some error occured...' }
    }
}

export async function logout() {
    try {
        await signOut(auth)
        localStorage.removeItem('auth-type')
        return { success: true }
    } catch { return { success: false } }
}

export async function getUserData(uid) {
    try {
        const info = await getDoc(doc(db, `/users/${uid}`))
        return { success: info.exists(), data: info.data() }
    } catch { return { success: false } }
}

export async function setUserData(uid, name, image, mobile, address, pincode) {
    try {
        const ref = doc(db, `/users/${uid}`)
        const info = await getDoc(ref)
        if (info.exists()) await updateDoc(ref, { name, image, mobile, address, pincode })
        else await setDoc(ref, { name, image, mobile, address, pincode })
        return { success: true }
    } catch { return { success: false } }
}

export async function initiateDonation(uid, description) {
    try {
        const ref = doc(db, `/users/${uid}`)
        const info = await getDoc(ref)
        const donation = { id: randomNumber(6), description, status: 'pending', uid, date: Date.now() }
        if (info.exists()) {
            var donations = info.data().donations || []
            donations.push(donation)
            await updateDoc(ref, { donations })
        }
        return { success: true, donations }
    } catch (error) { return { success: false } }
}

export async function acceptDonation(uid, id, ngoId) {
    try {
        const ref = doc(db, `/users/${uid}`)
        const info = await getDoc(ref)
        if (info.exists()) {
            const donations = info.data().donations || []
            for (let i = 0; i < donations.length; i++) {
                const donation = donations[i]
                if (donation.status === 'pending' && donation.id === id) {
                    const password = generatePassword()
                    donation.status = 'accepted'
                    donation.ngo = ngoId
                    donation.password = password
                    donations[i] = donation
                    await updateDoc(ref, { donations })
                    return { success: true, password }
                }
            }
        }
        return { success: false }
    } catch { return { success: false } }
}

export async function completeDonation(uid, id, password) {
    try {
        const ref = doc(db, `/users/${uid}`)
        const info = await getDoc(ref)
        if (info.exists()) {
            const donations = info.data().donations || []
            for (let i = 0; i < donations.length; i++) {
                const donation = donations[i]
                if (donation.status === 'accepted' && donation.id === id && donation.password === password) {
                    donation.status = 'donated'
                    donations[i] = donation
                    await updateDoc(ref, { donations })
                    return { success: true }
                }
            }
        }
        return { success: false }
    } catch { return { success: false } }
}

export async function getAllDonations(pincode) {
    try {
        const { docs } = await getDocs(collection(db, '/users'))
        let donations = []
        docs.forEach(doc => {
            const { name, pincode: userPincode, mobile, address, image, donations: userDonations } = doc.data()
            if (userPincode === pincode) {
                userDonations?.forEach((donation, i) => {
                    userDonations[i] = { ...donation, uid: doc.id, name, mobile, address, image }
                })
                donations.push(...(userDonations || []))
            }
        })
        return { success: Boolean(donations.length), donations }
    } catch { return { success: false } }
}

export async function signupNgo(email, password) {
    try {
        localStorage.setItem('auth-type', 'ngo')
        await createUserWithEmailAndPassword(auth, email, password)
        return { success: true }
    } catch (error) {
        return { success: false, error: error.code || 'Some error occured...' }
    }
}

export async function loginNgo(email, password) {
    try {
        localStorage.setItem('auth-type', 'ngo')
        await signInWithEmailAndPassword(auth, email, password)
        return { success: true }
    } catch (error) {
        localStorage.removeItem('auth-type')
        return { success: false, error: error.code || 'Some error occured...' }
    }
}

export async function getNgos(pincode = 'all') {
    try {
        const { docs } = await getDocs(collection(db, '/ngos'))
        let ngos = []
        docs.forEach(doc => {
            const data = doc.data()
            if (pincode === 'all' || data.pincode === pincode) ngos.push(data)
        })
        return { success: Boolean(ngos.length), ngos }
    } catch { return { success: false } }
}

export async function getAllEvents() {
    try {
        const { docs } = await getDocs(collection(db, '/ngos'))
        let events = []
        docs.forEach(doc => {
            const { name, image, events: ngoEvents } = doc.data()
            ngoEvents?.forEach((event, i) => {
                ngoEvents[i] = { ...event, name, ngoImage: image }
            })
            events.push(...(ngoEvents || []))
        })
        return { success: Boolean(events.length), events }
    } catch { return { success: false } }
}

export async function getNgoData(uid) {
    try {
        const info = await getDoc(doc(db, `/ngos/${uid}`))
        return { success: info.exists(), data: info.data() }
    } catch { return { success: false } }
}

export async function setNgoData(uid, name, website, image, description, mobile, address, pincode) {
    try {
        const ref = doc(db, `/ngos/${uid}`)
        const info = await getDoc(ref)
        if (info.exists()) await updateDoc(ref, { name, website, image, description, mobile, address, pincode })
        else await setDoc(ref, { name, website, image, description, mobile, address, pincode })
        return { success: true }
    } catch { return { success: false } }
}
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;
        // You can handle the user info here, e.g., saving it to your state or database
        console.log(user);
        return { success: true, user };
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.email;
        const credential = GoogleAuthProvider.credentialFromError(error);
        // Handle errors here
        console.error(error);
        return { success: false, error: errorMessage };
    }
};
// src/firebase.js (continued)
export const signInWithApple = async () => {
    try {
        const result = await signInWithPopup(auth, appleProvider);
        const credential = OAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;
        // You can handle the user info here, e.g., saving it to your state or database
        console.log(user);
        return { success: true, user };
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.email;
        const credential = OAuthProvider.credentialFromError(error);
        // Handle errors here
        console.error(error);
        return { success: false, error: errorMessage };
    }
};

export async function setEvent(uid, title, description, image, url) {
    try {
        const ref = doc(db, `/ngos/${uid}`)
        const info = await getDoc(ref)
        const event = { title, description, image, url, date: Date.now() }
        if (info.exists()) {
            const events = info.data().events || []
            events.push(event)
            await updateDoc(ref, { events })
            return { success: true, events }
        }
        return { success: false, error: 'Complete your profile first' }
    } catch { return { success: false, error: 'Some error occurred...' } }

    
    
}