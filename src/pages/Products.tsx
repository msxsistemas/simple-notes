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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product, OrderBump } from '@/types';

const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  price: z.string().min(1, 'Informe o preço'),
});

type ProductFormData = z.infer<typeof productSchema>;

// Mock products
const initialProducts: Product[] = [
  {
    id: 'PROD001',
    name: 'Curso de Marketing Digital',
    description: 'Aprenda marketing digital do zero ao avançado',
    price: 297.00,
    status: 'active',
    type: 'digital',
    checkout_url: 'https://pay.pixpay.com/curso-marketing',
    sold_count: 145,
    order_bumps: [
      { id: 'OB001', name: 'E-book Bônus', value: 47.00, status: 'active' },
    ],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'PROD002',
    name: 'Mentoria Individual',
    description: '4 sessões de mentoria personalizada',
    price: 997.00,
    status: 'active',
    type: 'digital',
    checkout_url: 'https://pay.pixpay.com/mentoria',
    sold_count: 32,
    order_bumps: [],
    created_at: '2024-01-05T00:00:00Z',
  },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      // Update existing product
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...p, ...data, price: parseFloat(data.price) }
          : p
      ));
      toast({ title: 'Sucesso', description: 'Produto atualizado!' });
    } else {
      // Create new product
      const newProduct: Product = {
        id: `PROD${String(products.length + 1).padStart(3, '0')}`,
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        status: 'active',
        type: 'digital',
        checkout_url: `https://pay.pixpay.com/${data.name.toLowerCase().replace(/\s/g, '-')}`,
        sold_count: 0,
        order_bumps: [],
        created_at: new Date().toISOString(),
      };
      setProducts([...products, newProduct]);
      toast({ title: 'Sucesso', description: 'Produto criado!' });
    }
    setIsCreateOpen(false);
    setEditingProduct(null);
    form.reset();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setValue('name', product.name);
    form.setValue('description', product.description);
    form.setValue('price', product.price.toString());
    setIsCreateOpen(true);
  };

  const handleDelete = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
    toast({ title: 'Produto removido', description: 'O produto foi excluído.' });
  };

  const toggleStatus = (productId: string) => {
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' }
        : p
    ));
  };

  const copyCheckoutUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado!', description: 'URL do checkout copiada para a área de transferência.' });
  };

  const totalRevenue = products.reduce((acc, p) => acc + (p.price * p.sold_count), 0);
  const totalSold = products.reduce((acc, p) => acc + p.sold_count, 0);

  return (
    <DashboardLayout title="Produtos">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-success/10 p-3 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendas Totais</p>
                <p className="text-2xl font-bold">{totalSold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-warning/10 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
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
                    <Button type="submit" className="gradient-primary">
                      {editingProduct ? 'Salvar' : 'Criar Produto'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Produto</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Bumps</TableHead>
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
                        onCheckedChange={() => toggleStatus(product.id)}
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
                  <TableCell>
                    {product.order_bumps.length > 0 ? (
                      <Badge variant="secondary">
                        {product.order_bumps.length} bump(s)
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Nenhum</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyCheckoutUrl(product.checkout_url)}>
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
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
