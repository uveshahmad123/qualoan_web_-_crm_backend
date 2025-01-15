import express from "express";
import { aadhaarOtp , saveAadhaarDetails, personalInfo ,currentResidence ,addIncomeDetails,uploadProfile, getProfile , getProfileDetails, getDashboardDetails, checkLoanElegblity , logout} from "../../Controllers/User/controller.user.js"; 
import {verifyOtp , mobileGetOtp , verifyPan} from "../../Controllers/User/controller.user.js";  
import { authMiddleware } from "../../middleware/User/authMiddleware.js";
import { calculateLoan, addEmploymentInfo, getApplicationStatus, getApplicationDetails, disbursalBankDetails , getDocumentStatus} from "../../Controllers/User/controller.loanApplication.js";
import { uploadDocuments } from "../../Controllers/User/docsUpload.js"
import upload from "../../config/multer.js";
const router = express.Router();

const uploadFields = upload.fields([
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
    { name: "eAadhaar", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "residential", maxCount: 1 },
    { name: "electricityBill", maxCount: 1 },
    { name: "gasConnection", maxCount: 1 },
    { name: "bankStatement", maxCount: 10 },
    { name: "salarySlip", maxCount: 10 },
    { name: "others", maxCount: 10 },
    { name: "profilePicture", maxCount: 1 },
]);


// login with aadhar
router.route("/aadhaar-login/:aadhaar").get(aadhaarOtp);     
router.post("/submit-aadhaar-otp", saveAadhaarDetails);    

// Profile APIs    
router.patch("/personalInfo", authMiddleware , personalInfo);  
router.patch("/currentResidence", authMiddleware , currentResidence);  
router.patch("/addIncomeDetails", authMiddleware , addIncomeDetails);   
router.patch("/uploadProfile", authMiddleware ,uploadFields, uploadProfile);   

// Dashboard APIs
router.get("/getProfile" , authMiddleware ,getProfile);   
router.get("/getProfileDetails" , authMiddleware ,getProfileDetails);  
router.get("/getDashboardDetails" , authMiddleware ,getDashboardDetails);  
router.get("/checkLoanElegblity" , authMiddleware ,checkLoanElegblity); 

// logout
router.post("/logout" , authMiddleware , logout)


// LoanApplication APIs
router.post("/applyLoan", authMiddleware, calculateLoan);
router.patch("/addEmploymentInfo", authMiddleware, addEmploymentInfo);
router.patch("/uploadDocuments", authMiddleware, uploadFields, uploadDocuments);
router.patch("/disbursalBankDetails", authMiddleware, disbursalBankDetails);
router.get("/getApplicationStatus", authMiddleware, getApplicationStatus);
router.get("/getApplicationDetails", authMiddleware, getApplicationDetails);
router.get("/getDocumentStatus" , authMiddleware , getDocumentStatus)


// verify
router.post("/mobile/get-otp/:mobile", authMiddleware, mobileGetOtp);
router.post("/mobile/verify-otp", verifyOtp);    
router.post("/verifyPAN/:pan",authMiddleware, verifyPan);


export default router;