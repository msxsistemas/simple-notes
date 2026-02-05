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
   return digits.length === 11;
 }
 
 export function isValidCNPJ(cnpj: string): boolean {
   const digits = cnpj.replace(/\D/g, '');
   return digits.length === 14;
 }
 
 export function isValidPhone(phone: string): boolean {
   const digits = phone.replace(/\D/g, '');
   return digits.length >= 10 && digits.length <= 11;
 }