import asyncHandler from "../middleware/asyncHandler.js";
import axios from "axios";
import Lead from "../models/Leads.js";
import Documents from "../models/Documents.js";
import { uploadDocs } from "../utils/docsUploadAndFetch.js";

export const initiate = async (formData) => {
    // Step-1: Initiate E-sign
    const eSignStepOne = await axios.post(
        "https://sm-kyc-sync-prod.scoreme.in/kyc/external/eSignFileUpload",
        formData,
        {
            headers: {
                clientId: process.env.SCOREME_BSA_CLIENT_ID,
                clientSecret: process.env.SCOREME_BSA_CLIENT_SECRET,
                "Content-Type": "application/pdf",
            },
        }
    );
    return eSignStepOne.data;
};

export const eSignStepTwo = async (referenceId) => {
    // Step-2
    const eSignStepTwo = await axios.get(
        `https://sm-kyc-sync-prod.scoreme.in/kyc/external/getkycrequestresponse?referenceId=${referenceId}`,
        {
            headers: {
                clientId: process.env.SCOREME_BSA_CLIENT_ID,
                clientSecret: process.env.SCOREME_BSA_CLIENT_SECRET,
            },
        }
    );
    return eSignStepTwo.data;
};

export const eSignStepThree = async (leadId, fullName, aadhaar, url) => {
    // Step-3
    const eSignStepThree = await axios.post(
        "https://sm-kyc-sync-prod.scoreme.in/kyc/external/customersAadhaareSign",
        {
            task: "url",
            callbackUrl: "google.com",
            uid: `${aadhaar}`,
            inputFile: `${url}`,
            name: `${fullName}`,
            multiPages: "true",
            signaturePosition: "",
            pageNo: "1",
            signatureType: "aadhaaresign",
            xCoordinate: "10",
            yCoordinate: "10",
        },
        {
            headers: {
                clientId: process.env.SCOREME_BSA_CLIENT_ID,
                clientSecret: process.env.SCOREME_BSA_CLIENT_SECRET,
                "Content-Type": "application/json",
            },
        }
    );
    const lead = await Lead.findOneAndUpdate(
        { _id: leadId },
        { referenceId: eSignStepThree.data.data.referenceId },
        { new: true }
    );

    if (!lead) {
        res.status(404);
        throw new Error({ success: false, message: "Lead not found." });
    }
    return eSignStepThree.data;
};

export const eSignStepFour = async (referenceId) => {
    // Step-4
    const eSignStepFour = await axios.get(
        `https://sm-kyc-sync-prod.scoreme.in/kyc/external/getkycrequestresponse?referenceId=${referenceId}`,
        {
            headers: {
                clientId: process.env.SCOREME_BSA_CLIENT_ID,
                clientSecret: process.env.SCOREME_BSA_CLIENT_SECRET,
            },
        }
    );
    return eSignStepFour.data;
};

// export const sendLinkToCustomer = async (eSignStepOne, formData) => {
//     if (eSignStepOne.data.code === "200") {
//         const eSignStepTwo = await axios.put(
//             `${eSignStepOne.data.model.uploadUrl}`,
//             formData,
//             {
//                 headers: {
//                     ...formData.getHeaders(), // Required to set proper Content-Type boundary
//                 },
//             }
//         );

//         const eSignStepThree = await axios.post(
//             "https://api.digitap.ai/clickwrap/v1/send/sign-in-link",
//             {
//                 docTransactionId: `${eSignStepOne.data.model.docTransactionId}`,
//                 sendNotification: true,
//             },
//             {
//                 headers: {
//                     ent_authorization: process.env.DIGITAP_AUTH_KEY,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );
//         return eSignStepThree.data;
//     }
// };

// @desc Esign webhook for Digitap to send us a response if doc is esigned
// @route POST /api/sanction/esign/success
// @access Public
export const eSignWebhook = asyncHandler(async (req, res) => {
    const data = req.body;
    if (data.data.dscData && Object.keys(data.data.dscData).length > 0) {
        const response = await getDoc(data.referenceId, data);
        if (!response.success) {
            res.status(400);
            throw new Error(response.message);
        }
        return res.status(200).json({
            success: true,
            message: "Document signed and saved successfully.",
        });
    }
    return res.json({ success: true });
});

export const getDoc = async (referenceId, data) => {
    try {
        const lead = await Lead.findOne({ referenceId: referenceId });
        const docs = await Documents.findOne({ _id: lead.documents });

        const eSignStepfive = await axios.get(data.data.result.esignedFile, {
            responseType: "arraybuffer", // Important to preserve the binary data
        });

        // Use the utility function to upload the PDF buffer
        const result = await uploadDocs(docs, null, null, {
            rawPdf: eSignStepfive.data,
            rawPdfKey: "sanctionLetter",
        });
        if (!result) {
            return { success: false, message: "Failed to upload PDF." };
        }
        return {
            success: true,
            message: "File uploaded.",
        };
    } catch (error) {
        console.log(error.data.message);
    }
};
