
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
  // Regex chuẩn số điện thoại Việt Nam
  const re = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  return re.test(phone);
};
