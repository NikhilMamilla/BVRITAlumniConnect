import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { alumniService } from '@/services/alumni';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const DatabaseDetails = () => {
  const [activeTab, setActiveTab] = useState<string>('students');
  
  const { data: alumni, isLoading: alumniLoading } = useQuery({
    queryKey: ['alumni'],
    queryFn: alumniService.getAlumni,
  });
  
  // Get student data and alumni verification data from the auth service
  const studentDatabase = authService.getStudentDatabase ? authService.getStudentDatabase() : [];
  const verifiedAlumni = authService.getVerifiedAlumni ? authService.getVerifiedAlumni() : [];
  
  return (
    <>
      <main className="container mx-auto px-4 py-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Database Details</h1>
          <p className="text-muted-foreground">
            View all students and alumni details stored in the database.
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="students">Student Records</TabsTrigger>
            <TabsTrigger value="alumni">Alumni Records</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Database Records</CardTitle>
                <CardDescription>
                  Student records stored in the system for verification purposes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studentDatabase.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentDatabase.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{student.rollNumber}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No student records found in the database.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alumni" className="space-y-6">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Verified Alumni Records</CardTitle>
                <CardDescription>
                  CSE alumni records used for verification during registration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {verifiedAlumni.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>College ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Graduation Year</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verifiedAlumni.map((alumni, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{alumni.collegeId}</TableCell>
                          <TableCell>{alumni.name}</TableCell>
                          <TableCell>{alumni.graduationYear}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No verified alumni records found.</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Alumni Directory</CardTitle>
                <CardDescription>
                  Registered alumni in the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alumniLoading ? (
                  <p className="text-center py-8">Loading alumni data...</p>
                ) : alumni && alumni.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Graduation Year</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alumni.map((alum) => (
                        <TableRow key={alum.id}>
                          <TableCell className="font-medium">{alum.name}</TableCell>
                          <TableCell>{alum.company} ({alum.position})</TableCell>
                          <TableCell>{alum.graduationYear}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {alum.skills.slice(0, 2).map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {alum.skills.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{alum.skills.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{alum.location}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No alumni found in the directory.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default DatabaseDetails;
