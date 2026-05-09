import { body } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createOffer, listOffersByStudent } from "../models/offerModel.js";
import { getApplicationById, updateApplicationStatus } from "../models/applicationModel.js";
import { HttpError } from "../utils/httpError.js";
import { APPLICATION_STATUS } from "../utils/constants.js";

export const offerValidation = [
  body("applicationId").isUUID().withMessage("Valid applicationId is required"),
  body("offerLetterUrl").isURL().withMessage("Offer letter URL is required"),
  body("certificateUrl").optional({ nullable: true }).isURL().withMessage("Certificate URL must be valid")
];

export const issueOffer = asyncHandler(async (req, res) => {
  const application = await getApplicationById(req.body.applicationId);
  if (!application) {
    throw new HttpError(404, "Application not found");
  }

  await updateApplicationStatus(application.id, APPLICATION_STATUS.OFFER_RELEASED);
  const offer = await createOffer(req.body);
  res.status(201).json({ success: true, data: offer });
});

export const getMyOffers = asyncHandler(async (req, res) => {
  const offers = await listOffersByStudent(req.user.id);
  res.json({ success: true, data: offers });
});
