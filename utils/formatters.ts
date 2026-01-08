
export const formatCurrencyInput = (value: string): string => {
  // Loại bỏ tất cả ký tự không phải số
  const cleanValue = value.replace(/\D/g, "");
  // Định dạng với dấu phẩy phân cách phần ngàn
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const parseCurrencyString = (value: string): number => {
  return Number(value.replace(/,/g, ""));
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateVNPhone = (phone: string): boolean => {
  // Mobile: 10 digits, starts with 03, 05, 07, 08, 09
  // Landline: 11 digits, starts with 02
  const re = /^(0[3|5|7|8|9][0-9]{8}|02[0-9]{9})$/;
  return re.test(phone);
};

/**
 * Loại bỏ dấu tiếng Việt để phục vụ tìm kiếm
 */
export const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

/**
 * Định dạng ngày tháng thành dd/mm/yyyy
 */
export const formatDate = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  
  return `${d}/${m}/${y}`;
};

/**
 * Định dạng ngày giờ thành dd/mm/yyyy HH:mm
 */
export const formatDateTime = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const dateStr = formatDate(date);
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  return `${dateStr} ${timeStr}`;
};
