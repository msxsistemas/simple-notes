 // Máscaras de formatação para campos de entrada
 
 export function formatCPF(value: string): string {
   const digits = value.replace(/\D/g, '').slice(0, 11);
   return digits
     .replace(/(\d{3})(\d)/, '$1.$2')
     .replace(/(\d{3})(\d)/, '$1.$2')
     .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
 }
 
 export function formatCNPJ(value: string): string {
   const digits = value.replace(/\D/g, '').slice(0, 14);
   return digits
     .replace(/(\d{2})(\d)/, '$1.$2')
     .replace(/(\d{3})(\d)/, '$1.$2')
     .replace(/(\d{3})(\d)/, '$1/$2')
     .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
 }
 
 export function formatCPFOrCNPJ(value: string): string {
   const digits = value.replace(/\D/g, '');
   if (digits.length <= 11) {
     return formatCPF(value);
   }
   return formatCNPJ(value);
 }
 
 export function formatPhone(value: string): string {
   const digits = value.replace(/\D/g, '').slice(0, 11);
   if (digits.length <= 10) {
     return digits
       .replace(/(\d{2})(\d)/, '($1) $2')
       .replace(/(\d{4})(\d)/, '$1-$2');
   }
   return digits
     .replace(/(\d{2})(\d)/, '($1) $2')
     .replace(/(\d{5})(\d)/, '$1-$2');
 }
 
 export function formatCurrency(value: string): string {
   // Remove tudo que não é número
   const digits = value.replace(/\D/g, '');
   if (!digits) return '';
   
   // Converte para número com 2 casas decimais
   const number = parseInt(digits, 10) / 100;
   
   // Formata como moeda brasileira sem o símbolo
   return number.toLocaleString('pt-BR', {
     minimumFractionDigits: 2,
     maximumFractionDigits: 2,
   });
 }
 
 export function parseCurrency(value: string): number {
   // Remove pontos de milhar e substitui vírgula por ponto
   const cleanValue = value.replace(/\./g, '').replace(',', '.');
   return parseFloat(cleanValue) || 0;
 }
 
 // Validações simples
 export function isValidEmail(email: string): boolean {
   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 }
 
 export function isValidCPF(cpf: string): boolean {
   const digits = cpf.replace(/\D/g, '');
   if (digits.length !== 11) return false;
   
   // Check for known invalid patterns (all same digits)
   if (/^(\d)\1{10}$/.test(digits)) return false;
   
   // Validate first check digit
   let sum = 0;
   for (let i = 0; i < 9; i++) {
     sum += parseInt(digits[i]) * (10 - i);
   }
   let remainder = (sum * 10) % 11;
   if (remainder === 10 || remainder === 11) remainder = 0;
   if (remainder !== parseInt(digits[9])) return false;
   
   // Validate second check digit
   sum = 0;
   for (let i = 0; i < 10; i++) {
     sum += parseInt(digits[i]) * (11 - i);
   }
   remainder = (sum * 10) % 11;
   if (remainder === 10 || remainder === 11) remainder = 0;
   if (remainder !== parseInt(digits[10])) return false;
   
   return true;
 }
 
 export function isValidCNPJ(cnpj: string): boolean {
   const digits = cnpj.replace(/\D/g, '');
   return digits.length === 14;
 }
 
 export function isValidPhone(phone: string): boolean {
   const digits = phone.replace(/\D/g, '');
   return digits.length >= 10 && digits.length <= 11;
 }