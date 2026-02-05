 import { useState } from 'react';
 import { useForm } from 'react-hook-form';
 import { zodResolver } from '@hookform/resolvers/zod';
 import { z } from 'zod';
 import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Switch } from '@/components/ui/switch';
 import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from '@/components/ui/dialog';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { 
   Plus, 
   Pencil, 
   Trash2, 
   MoreVertical, 
   Package, 
   Link2,
   ShoppingCart,
   TrendingUp,
   Loader2,
 } from 'lucide-react';
 import { useToast } from '@/hooks/use-toast';
 import { 
   useProducts, 
   useCreateProduct, 
   useUpdateProduct, 
   useDeleteProduct,
   Product,
 } from '@/hooks/useProducts';
 
 const productSchema = z.object({
   name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
   description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
   price: z.string().min(1, 'Informe o preço'),
 });
 
 type ProductFormData = z.infer<typeof productSchema>;
 
 export default function Products() {
   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
   const { toast } = useToast();
 
   const { data: products, isLoading } = useProducts();
   const createProduct = useCreateProduct();
   const updateProduct = useUpdateProduct();
   const deleteProduct = useDeleteProduct();
 
   const form = useForm<ProductFormData>({
     resolver: zodResolver(productSchema),
     defaultValues: {
       name: '',
       description: '',
       price: '',
     },
   });
 
   const onSubmit = async (data: ProductFormData) => {
     try {
       if (editingProduct) {
         await updateProduct.mutateAsync({
           id: editingProduct.id,
           name: data.name,
           description: data.description,
           price: parseFloat(data.price),
         });
         toast({ title: 'Sucesso', description: 'Produto atualizado!' });
       } else {
         await createProduct.mutateAsync({
           name: data.name,
           description: data.description,
           price: parseFloat(data.price),
           type: 'digital',
         });
         toast({ title: 'Sucesso', description: 'Produto criado!' });
       }
       setIsCreateOpen(false);
       setEditingProduct(null);
       form.reset();
     } catch (error) {
       toast({ title: 'Erro', description: 'Não foi possível salvar o produto', variant: 'destructive' });
     }
   };
 
   const handleEdit = (product: Product) => {
     setEditingProduct(product);
     form.setValue('name', product.name);
     form.setValue('description', product.description || '');
     form.setValue('price', product.price.toString());
     setIsCreateOpen(true);
   };
 
   const handleDelete = async (productId: string) => {
     try {
       await deleteProduct.mutateAsync(productId);
       toast({ title: 'Produto removido', description: 'O produto foi excluído.' });
     } catch (error) {
       toast({ title: 'Erro', description: 'Não foi possível remover o produto', variant: 'destructive' });
     }
   };
 
   const toggleStatus = async (product: Product) => {
     try {
       await updateProduct.mutateAsync({
         id: product.id,
         status: product.status === 'active' ? 'inactive' : 'active',
       });
     } catch (error) {
       toast({ title: 'Erro', description: 'Não foi possível alterar o status', variant: 'destructive' });
     }
   };
 
   const copyCheckoutUrl = (url: string | null) => {
     if (!url) return;
     navigator.clipboard.writeText(url);
     toast({ title: 'Link copiado!', description: 'URL do checkout copiada para a área de transferência.' });
   };
 
   const totalRevenue = (products || []).reduce((acc, p) => acc + (p.price * p.sold_count), 0);
   const totalSold = (products || []).reduce((acc, p) => acc + p.sold_count, 0);
 
   if (isLoading) {
     return (
       <DashboardLayout title="Produtos">
         <div className="flex items-center justify-center h-64">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       </DashboardLayout>
     );
   }
 
   return (
     <DashboardLayout title="Produtos">
       {/* Stats */}
       <div className="grid gap-4 md:grid-cols-3 mb-6">
         <Card className="border-border/50">
           <CardContent className="pt-6">
             <div className="flex items-center gap-4">
                <div className="h-7 w-7 flex items-center justify-center border-2 border-primary rounded-full">
                  <Package className="h-4 w-4 text-primary" strokeWidth={1.5} />
               </div>
               <div>
                  <p className="text-sm text-muted-foreground font-bold">Total de Produtos</p>
                 <p className="text-2xl font-bold">{products?.length || 0}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card className="border-border/50">
           <CardContent className="pt-6">
             <div className="flex items-center gap-4">
                <div className="h-7 w-7 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-success" strokeWidth={1.5} />
               </div>
               <div>
                  <p className="text-sm text-muted-foreground font-bold">Vendas Totais</p>
                 <p className="text-2xl font-bold">{totalSold}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card className="border-border/50">
           <CardContent className="pt-6">
             <div className="flex items-center gap-4">
                <div className="h-7 w-7 flex items-center justify-center border-2 border-success rounded-full">
                  <TrendingUp className="h-4 w-4 text-success" strokeWidth={1.5} />
               </div>
               <div>
                  <p className="text-sm text-muted-foreground font-bold">Receita Total</p>
                 <p className="text-2xl font-bold">
                   R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Products Table */}
       <Card className="border-border/50">
         <CardHeader className="flex flex-row items-center justify-between">
           <div>
             <CardTitle>Meus Produtos</CardTitle>
             <CardDescription>Gerencie seus produtos e ofertas</CardDescription>
           </div>
           <Dialog open={isCreateOpen} onOpenChange={(open) => {
             setIsCreateOpen(open);
             if (!open) {
               setEditingProduct(null);
               form.reset();
             }
           }}>
             <DialogTrigger asChild>
               <Button className="gradient-primary gap-2">
                 <Plus className="h-4 w-4" />
                 Novo Produto
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>
                   {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                 </DialogTitle>
                 <DialogDescription>
                   {editingProduct ? 'Atualize as informações do produto' : 'Crie um novo produto digital'}
                 </DialogDescription>
               </DialogHeader>
               <Form {...form}>
                 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                   <FormField
                     control={form.control}
                     name="name"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Nome do Produto</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="Ex: Curso de Marketing" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="description"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Descrição</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="Descreva seu produto" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="price"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Preço (R$)</FormLabel>
                         <FormControl>
                           <Input {...field} type="number" step="0.01" placeholder="0,00" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <DialogFooter>
                     <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                       Cancelar
                     </Button>
                     <Button type="submit" className="gradient-primary" disabled={createProduct.isPending || updateProduct.isPending}>
                       {(createProduct.isPending || updateProduct.isPending) && (
                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       )}
                       {editingProduct ? 'Salvar' : 'Criar Produto'}
                     </Button>
                   </DialogFooter>
                 </form>
               </Form>
             </DialogContent>
           </Dialog>
         </CardHeader>
         <CardContent>
           {!products || products.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
               <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>Nenhum produto cadastrado</p>
               <p className="text-sm">Clique em "Novo Produto" para começar</p>
             </div>
           ) : (
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted/50">
                   <TableHead>Produto</TableHead>
                   <TableHead>Preço</TableHead>
                   <TableHead>Vendas</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead className="text-right">Ações</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {products.map((product) => (
                   <TableRow key={product.id}>
                     <TableCell>
                       <div>
                         <p className="font-medium">{product.name}</p>
                         <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                           {product.description}
                         </p>
                       </div>
                     </TableCell>
                     <TableCell className="font-semibold">
                       R$ {product.price.toFixed(2)}
                     </TableCell>
                     <TableCell>{product.sold_count}</TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <Switch
                           checked={product.status === 'active'}
                           onCheckedChange={() => toggleStatus(product)}
                         />
                         <Badge 
                           className={product.status === 'active' 
                             ? 'bg-success/10 text-success' 
                             : 'bg-muted text-muted-foreground'
                           }
                         >
                           {product.status === 'active' ? 'Ativo' : 'Inativo'}
                         </Badge>
                       </div>
                     </TableCell>
                     <TableCell className="text-right">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                             <MoreVertical className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => copyCheckoutUrl(product.checkout_url)} disabled={!product.checkout_url}>
                             <Link2 className="h-4 w-4 mr-2" />
                             Copiar Link
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleEdit(product)}>
                             <Pencil className="h-4 w-4 mr-2" />
                             Editar
                           </DropdownMenuItem>
                           <DropdownMenuItem 
                             onClick={() => handleDelete(product.id)}
                             className="text-destructive"
                           >
                             <Trash2 className="h-4 w-4 mr-2" />
                             Excluir
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           )}
         </CardContent>
       </Card>
     </DashboardLayout>
   );
 }