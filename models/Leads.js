import mongoose from "mongoose";


const extraDetailsSchema = new mongoose.Schema({
    personalDetails: {
        type: Object
    },
    employeDetails: {
        type: Object
    },
    residenceDetails: {
        type: Object
    },
    incomeDetails: {
        type: Object
    },
    disbursalBankDetails:{
        type : Object
    }
});

const leadSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        fName: {
            type: String,
            required: true,
        },
        mName: {
            type: String,
        },
        lName: {
            type: String,
        },
        gender: {
            type: String,
            required: true,
            enum: ["M", "F", "O"],
        },
        dob: {
            type: Date,
            required: true,
        },
        leadNo: {
            type: String,
            required: true,
        },
        aadhaar: {
            type: String,
            required: true,
            // unique: true,
        },
        pan: {
            type: String,
            required: true,
            // unique: true,
        },
        cibilScore: {
            type: String,
        },
        mobile: {
            type: String,
            required: true,
        },
        alternateMobile: {
            type: String,
        },
        personalEmail: {
            type: String,
            required: true,
        },
        officeEmail: {
            type: String,
            required: true,
        },
        loanAmount: {
            type: Number,
            required: true,
        },
        salary: {
            type: Number,
            required: true,
        },
        pinCode: {
            type: Number,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        screenerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
        },
        onHold: {
            type: Boolean,
            default: false,
        },
        heldBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
        },
        leadStatus: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LeadStatus",
        },
        isMobileVerified: {
            type: Boolean,
            default: false,
        },
        emailOtp: Number,
        emailOtpExpiredAt: { type: Date },
        isAadhaarVerified: { type: Boolean, default: true },
        isAadhaarDetailsSaved: { type: Boolean, default: true },
        isPanVerified: { type: Boolean, default: true },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isRejected: {
            type: Boolean,
            default: false,
        },
        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
        },

        documents: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
        },

        stage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LeadStatus",
        },

        // document: {
        //     singleDocuments: [
        //         {
        //             name: {
        //                 type: String,
        //                 required: true,
        //             },
        //             type: {
        //                 type: String,
        //                 enum: [
        //                     "aadhaarFront",
        //                     "aadhaarBack",
        //                     "eAadhaar",
        //                     "panCard",
        //                     "cibilReport",
        //                     "sanctionLetter",
        //                     // Add more document types as needed
        //                 ],
        //             },
        //             url: {
        //                 type: String,
        //                 required: true,
        //             },
        //             remarks: {
        //                 type: String,
        //             },
        //         },
        //     ],
        //     multipleDocuments: {
        //         bankStatement: [
        //             {
        //                 name: {
        //                     type: String,
        //                     required: true,
        //                 },
        //                 url: {
        //                     type: String,
        //                     required: true,
        //                 },
        //                 remarks: {
        //                     type: String,
        //                 },
        //             },
        //         ],
        //         salarySlip: [
        //             {
        //                 name: {
        //                     type: String,
        //                     required: true,
        //                 },
        //                 url: {
        //                     type: String,
        //                     required: true,
        //                 },
        //                 remarks: {
        //                     type: String,
        //                 },
        //             },
        //         ],
        //         others: [
        //             {
        //                 name: {
        //                     type: String,
        //                     required: true,
        //                 },
        //                 url: {
        //                     type: String,
        //                     required: true,
        //                 },
        //                 remarks: {
        //                     type: String,
        //                 },
        //             },
        //         ],
        //     },
        // },
        isRecommended: {
            type: Boolean,
            default: false,
        },
        recommendedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
        },
        source: {
            type: String,
            required: true,
            enum: ["website", "bulk", "landingPage", "whatsapp", "app"],
            default: "website",
        },
        extraDetails: {
            type: extraDetailsSchema
        },
        referenceId: {
            type: String,
        },
    },
    { timestamps: true }
);

const Lead = mongoose.model("Lead", leadSchema);
export default Lead;
