import asyncHandler from '../../middleware/asyncHandler.js';
import User from '../../models/User/model.user.js';
import LoanApplication from '../../models/User/model.loanApplication.js';
import Documents from '../../models/Documents.js';
import Lead from '../../models/Leads.js'
import LeadStatus from '../../models/LeadStatus.js'
import { nextSequence } from "../../utils/nextSequence.js";
import { postLogs } from "../../Controllers/logs.js"
import checkUploadedDocuments from "../../utils/User/isDocumentUploaded.js"
import splitName from "../../utils/splitName.js"
import { postUserLogs } from './controller.userLogs.js';



const calculateLoan = asyncHandler(async (req, res) => {
    const loanDetails = req.body;
    const { principal, totalPayble, intrestPerMonth, tenureMonth } = loanDetails;

    if (
        principal <= 0 ||
        totalPayble <= 0 ||
        intrestPerMonth <= 0 ||
        tenureMonth <= 0
    ) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    if (!user.isCompleteRegistration) {
        return res.status(400).json({ message: "firstly please complete your registration" })
    }

    let previousLoanApplication = await LoanApplication.findOne({ userId: user._id });

    if (previousLoanApplication && previousLoanApplication.applicationStatus == "PENDING") {
        previousLoanApplication.loanDetails = loanDetails;
        await previousLoanApplication.save();
        return res.status(200).json({ message: "Loan Application updated successfully" });
    }

    const loanApplication = await LoanApplication.create({
        userId: user._id,
        loanDetails
    });

    if (!loanApplication) {
        return res.status(400).json({ message: "Loan Application not created" });
    }
    await postUserLogs(user._id,`User calculate the loan amount`)

    return res.status(200).json({ message: "Loan Application created successfully", loanApplication: loanApplication.loanDetails });

});

const addEmploymentInfo = asyncHandler(async (req, res) => {
    const employeInfo = req.body;
    const userId = req.user._id;
    if (!employeInfo || !userId) {
        return res.status(400).json({ message: "Invalid input" });
    }

    // Validation for employment information
    const requiredFields = [
        "workFrom",
        "officeEmail",
        "companyName",
        "companyType",
        "designation",
        "officeAddrress",
        "city",
        "state",
        "pincode"
    ];

    const missingFields = requiredFields.filter((field) => !employeInfo[field] || employeInfo[field].trim() === "");

    if (missingFields.length > 0) {
        return res.status(400).json({
            message: "Missing or empty required fields",
            missingFields,
        });
    }

    const loanDetails = await LoanApplication.findOneAndUpdate(
        { userId: userId, applicationStatus: "PENDING" }
    )

    if (!loanDetails) {
        return res.status(400).json({ message: "Loan Application not found" })
    }

    let progressStatus
    let previousJourney
    if (loanDetails.progressStatus == "CALCULATED") {
        progressStatus = "EMPLOYMENT_DETAILS_SAVED",
            previousJourney = "CALCULATED"
    }

    if (loanDetails.progressStatus != "CALCULATED") {
        progressStatus = loanDetails.progressStatus,
            previousJourney = loanDetails.previousJourney
    }


    const addEmploymentInfo = await LoanApplication.findOneAndUpdate(
        { userId: userId, applicationStatus: "PENDING" },
        {
            $set: {
                employeeDetails: employeInfo,
                progressStatus: progressStatus,
                previousJourney: previousJourney
            }
        },

        {
            new: true

        }
    );

    if (!addEmploymentInfo) {
        return res.status(400).json({ message: "Employment Info not added" });
    }
    await postUserLogs(userId, `User add employment info`)
    return res.status(200).json({ message: "Employment Info added successfully", EmploymentInfo: addEmploymentInfo.employeeDetails });
});

const disbursalBankDetails = asyncHandler(async (req, res) => {
    const bankDetails = req.body;
    const userId = req.user._id;
    if (!bankDetails || !userId) {
        return res.status(400).json({ message: "Invalid input" });
    }


    const loanDetails = await LoanApplication.findOneAndUpdate(
        { userId: userId, applicationStatus: "PENDING" }
    )

    if (!loanDetails) {
        return res.status(400).json({ message: "Loan Application not found" })
    }

    let progressStatus
    let previousJourney
    if (loanDetails.progressStatus == "DOCUMENTS_SAVED") {
        progressStatus = "COMPLETED",
            previousJourney = "DISBURSAL_DETAILS_SAVED"
    }

    if (loanDetails.progressStatus != "DOCUMENTS_SAVED") {
        progressStatus = loanDetails.progressStatus,
            previousJourney = loanDetails.previousJourney
    }


    const addBankDetails = await LoanApplication.findOneAndUpdate(
        { userId: userId },
        {
            $set: {
                disbursalBankDetails: bankDetails,
                progressStatus: progressStatus,
                previousJourney: previousJourney

            }
        },

        {
            new: true

        }
    );

    if (!addBankDetails) {
        return res.status(400).json({ message: "Bank Details not added" });
    }
    await postUserLogs(userId, `User add bank  disbursal details`)

    const userDetails = await User.findById(userId)
    let docs;
    let pan = userDetails.PAN
    const exisitingDoc = await Documents.findOne({ pan: userDetails.PAN });
    if (exisitingDoc) {
        docs = exisitingDoc;
    } else {
        docs = await Documents.create({
            pan: pan,
        });
    }

    const isDocumentUploaded = checkUploadedDocuments(docs.document)
    if (!isDocumentUploaded.isComplete) {
        return res.status(400).json({ message: "Please upload all documents", missingDocument: isDocumentUploaded.missingDocuments })
    }

    // pass extraObject In Lead
    const personalDetails = userDetails.personalDetails
    const employeDetails = loanDetails.employeeDetails
    const disbursalBankDetails = loanDetails.disbursalBankDetails
    const residenceDetails = userDetails.residenceDetails
    const incomeDetails = userDetails.incomeDetails




    // logic of creating lead

    const { fName, mName, lName } = splitName(userDetails.personalDetails.fullName)


    const leadNo = await nextSequence("leadNo", "QUALED", 10);

    const leadStatus = await LeadStatus.create({
        pan: pan,
        leadNo,
        isInProcess: true,
    });


    const [day, month, year] = userDetails.personalDetails.dob.split('-');
    const dob = new Date(`${year}-${month}-${day}`);
    const newLead = await Lead.create({
        userId,
        fName: fName,
        mName: mName,
        lName: lName,
        gender: userDetails.personalDetails.gender,
        dob: dob,
        leadNo,
        aadhaar: userDetails.aadarNumber,
        pan: userDetails.PAN,
        documents: docs._id.toString(),
        mobile: String(userDetails.mobile),
        alternateMobile: userDetails.alternateMobile ? String(alternateMobile) : "",
        personalEmail: userDetails.personalDetails.personalEmail ? userDetails.personalDetails.personalEmail : "",
        officeEmail: loanDetails.employeeDetails.officeEmail ? loanDetails.employeeDetails.officeEmail : "",
        loanAmount: loanDetails.loanDetails.principal,
        salary: userDetails.incomeDetails.monthlyIncome,
        pinCode: userDetails.residenceDetails.pincode,
        state: userDetails.residenceDetails.state,
        city: userDetails.residenceDetails.city,
        source: userDetails.platformType,
        leadStatus: leadStatus._id,
        extraDetails: [
            personalDetails,
            employeDetails,
            disbursalBankDetails,
            residenceDetails,
            incomeDetails
        ]
    });

    if (!newLead) {
        res.status(400).json({ message: "Lead not created" });
        throw new Error("Lead not created!!!");
    }

    // viewLeadsLog(req, res, status || '', borrower || '', leadRemarks = '');
    const logs = await postLogs(
        newLead._id,
        "NEW LEAD",
        `${newLead.fName}${newLead.mName && ` ${newLead.mName}`}${newLead.lName && ` ${newLead.lName}`
        }`,
        "New lead created"
    );


    return res.status(200).json({ message: "Loan Applied successfully!", newLead, logs });
});

const getApplicationStatus = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId)
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    const loanDetails = await LoanApplication.findOne({ userId: userId, applicationStatus: "PENDING" });
    if (!loanDetails) {
        return res.status(400).json({ message: "Loan Application not found" });
    }

    return res.status(200).json({ message: "Loan Application found", applicationStatus: loanDetails.applicationStatus, progressStatus: loanDetails.progressStatus });
});

const getApplicationDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { applicationStatus } = req.query;

    if (!userId) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const loanApplicationDetails = await LoanApplication.findOne({ userId, applicationStatus: "PENDING" });
    if (!loanApplicationDetails) {
        return res.status(400).json({ message: "Loan Application not found" });
    }

    let data;

    if (applicationStatus == "loanDetails") {
        data = loanApplicationDetails.loanDetails
        return res.status(200).json({ message: "sucessfully fetched", data });
    }

    if (applicationStatus == "employeeDetails") {
        data = loanApplicationDetails.employeeDetails
        return res.status(200).json({ message: "sucessfully fetched", data });
    }

    if (applicationStatus == "disbursalBankDetails") {
        data = loanApplicationDetails.disbursalBankDetails
        return res.status(200).json({ message: "sucessfully fetched", data });
    }

    data = loanApplicationDetails
    return res.status(200).json({ message: "sucessfully fetched", data });

});

const getDocumentStatus = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userDetails = await User.findById(userId);
    const pan = userDetails.PAN;
    const data = await Documents.findOne({ pan: pan });

    // implementing aggregation pipeline

    // const pipeline = [
    //     {
    //       $match: {
    //         pan: pan
    //       }
    //     },
    //     {
    //       $project: {
    //         multipleDocumentsStatus: {
    //           $map: {
    //             input: {
    //               $objectToArray:
    //                 "$document.multipleDocuments"
    //             },
    //             as: "doc",
    //             in: {
    //               type: "$$doc.k",
    //               status: {
    //                 $cond: {
    //                   if: {
    //                     $gt: [
    //                       {
    //                         $size: "$$doc.v"
    //                       },
    //                       0
    //                     ]
    //                   },
    //                   then: "Uploaded",
    //                   else: "Not Uploaded"
    //                 }
    //               }
    //             }
    //           }
    //         },
    //         singleDocumentsStatus: {
    //           $map: {
    //             input: "$document.singleDocuments",
    //             as: "doc",
    //             in: {
    //               type: "$$doc.type",
    //               status: "Uploaded"
    //             }
    //           }
    //         }
    //       }
    //     }
    //   ]

    // const reults = await Documents.aggregate(pipeline); 

    const multipleDocs = data.document.multipleDocuments;
    const singleDocs = data.document.singleDocuments;

    // Check multiple documents
    const multipleDocumentsStatus = {};
    for (const [key, value] of Object.entries(multipleDocs)) {
        multipleDocumentsStatus[key] = value.length > 0 ? 'Uploaded' : 'Not Uploaded';
    }

    // Check single documents
    const singleDocumentsStatus = singleDocs.map(doc => ({
        type: doc.type,
        status: 'Uploaded',
    }));

    const response = {
        multipleDocumentsStatus,
        singleDocumentsStatus,
    };

    return res.status(200).json(response);

})

export { calculateLoan, addEmploymentInfo, getApplicationStatus, getApplicationDetails, disbursalBankDetails, getDocumentStatus }