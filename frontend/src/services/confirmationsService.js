import api from '../config/axios';
import {
  createConfirmationsService,
  fetchPublicRescheduleOptions as fetchPublicRescheduleOptionsFromService,
  submitPublicConfirmation as submitPublicConfirmationFromService,
} from './confirmationsService.shared';

const confirmationsService = createConfirmationsService(api);

export const fetchPublicRescheduleOptions = async (token) => (
  fetchPublicRescheduleOptionsFromService(token, confirmationsService)
);

export const submitPublicConfirmation = async (token, payload) => (
  submitPublicConfirmationFromService(token, payload, confirmationsService)
);
