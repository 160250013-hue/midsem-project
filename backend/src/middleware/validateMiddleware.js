import { validationResult } from "express-validator";
import { HttpError } from "../utils/httpError.js";

export const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError(422, errors.array()[0].msg));
  }

  next();
};
