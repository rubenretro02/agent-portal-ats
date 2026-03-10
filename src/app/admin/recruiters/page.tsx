'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStore } from '@/store/adminStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserPlus,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Shield,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AdminUser } from '@/types/admin';

export default function RecruitersPage() {
  const router = useRouter();
  const {
    currentUser,
    recruiters,
    fetchRecruiters,
    addRecruiter,
    toggleRecruiterStatus,
    deleteRecruiter,
    hasPermission,
    isLoading
  } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<AdminUser | null>(null);
  const [newRecruiter, setNewRecruiter] = useState({
    email: '',
    firstName: '',
    lastName: '',
    department: '',
    phone: '',
  });

  useEffect(() => {
    if (!hasPermission('canViewRecruiters')) {
      router.push('/admin');
      return;
    }
    fetchRecruiters();
  }, [fetchRecruiters, hasPermission, router]);

  const filteredRecruiters = recruiters.filter(r =>
    r.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRecruiter = async () => {
    if (!newRecruiter.email || !newRecruiter.firstName || !newRecruiter.lastName) {
      return;
    }

    await addRecruiter({
      email: newRecruiter.email,
      firstName: newRecruiter.firstName,
      lastName: newRecruiter.lastName,
      department: newRecruiter.department || 'Talent Acquisition',
      phone: newRecruiter.phone,
      role: 'recruiter',
      isActive: true,
    });

    setNewRecruiter({ email: '', firstName: '', lastName: '', department: '', phone: '' });
    setAddDialogOpen(false);
  };

  const handleDeleteRecruiter = async () => {
    if (!selectedRecruiter) return;
    await deleteRecruiter(selectedRecruiter.id);
    setDeleteDialogOpen(false);
    setSelectedRecruiter(null);
  };

  const activeCount = recruiters.filter(r => r.isActive).length;
  const inactiveCount = recruiters.filter(r => !r.isActive).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Recruiters</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Manage team members who can post campaigns and process applications
            </p>
          </div>

          {hasPermission('canManageRecruiters') && (
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Recruiter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Recruiter</DialogTitle>
                  <DialogDescription>
                    Create a new recruiter account. They will receive an email invitation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name *</Label>
                      <Input
                        value={newRecruiter.firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewRecruiter({ ...newRecruiter, firstName: e.target.value })
                        }
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name *</Label>
                      <Input
                        value={newRecruiter.lastName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewRecruiter({ ...newRecruiter, lastName: e.target.value })
                        }
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newRecruiter.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewRecruiter({ ...newRecruiter, email: e.target.value })
                      }
                      placeholder="john.doe@agenthub.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={newRecruiter.department}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewRecruiter({ ...newRecruiter, department: e.target.value })
                      }
                      placeholder="Talent Acquisition"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      value={newRecruiter.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewRecruiter({ ...newRecruiter, phone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddRecruiter}
                    disabled={isLoading || !newRecruiter.email || !newRecruiter.firstName}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    {isLoading ? 'Adding...' : 'Add Recruiter'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Total Recruiters</p>
                  <p className="text-2xl font-bold text-zinc-900">{recruiters.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-zinc-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Active</p>
                  <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Inactive</p>
                  <p className="text-2xl font-bold text-zinc-400">{inactiveCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-zinc-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search recruiters..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Recruiters Table */}
        <Card className="border-zinc-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recruiter</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  {hasPermission('canManageRecruiters') && (
                    <TableHead className="w-[50px]"></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecruiters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                      No recruiters found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecruiters.map((recruiter) => (
                    <TableRow key={recruiter.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-medium text-sm">
                            {recruiter.firstName[0]}{recruiter.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">
                              {recruiter.firstName} {recruiter.lastName}
                            </p>
                            <p className="text-sm text-zinc-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {recruiter.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-600">{recruiter.department || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={recruiter.isActive ? 'default' : 'secondary'}
                          className={recruiter.isActive ? 'bg-emerald-500' : ''}
                        >
                          {recruiter.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-zinc-500">
                          {recruiter.lastLogin
                            ? formatDistanceToNow(new Date(recruiter.lastLogin), { addSuffix: true })
                            : 'Never'
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-zinc-500">
                          {formatDistanceToNow(new Date(recruiter.createdAt), { addSuffix: true })}
                        </span>
                      </TableCell>
                      {hasPermission('canManageRecruiters') && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleRecruiterStatus(recruiter.id)}>
                                {recruiter.isActive ? (
                                  <><XCircle className="h-4 w-4 mr-2" />Deactivate</>
                                ) : (
                                  <><CheckCircle2 className="h-4 w-4 mr-2" />Activate</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRecruiter(recruiter);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Recruiter</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedRecruiter?.firstName} {selectedRecruiter?.lastName}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRecruiter}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
