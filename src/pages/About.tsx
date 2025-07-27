import React from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, MapPin, Award, BookOpen, Users, Building } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-4">About BVRIT Narsapur</h1>
          <p className="text-lg text-gray-600 mb-8">
            Established in 2005, B V Raju Institute of Technology (BVRIT) Narsapur is one of the premier engineering colleges in Telangana, 
            offering quality technical education with a focus on innovation and research.
          </p>
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="academics">Academics</TabsTrigger>
              <TabsTrigger value="campus">Campus</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center">
                        <Building className="mr-2 h-5 w-5 text-primary" /> Institute Vision
                      </h3>
                      <p className="text-gray-600">
                        To be a premier engineering institution that prepares students to be future leaders who can address 
                        the evolving needs of the industry and society at large.
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center">
                        <Users className="mr-2 h-5 w-5 text-primary" /> Our History
                      </h3>
                      <p className="text-gray-600 mb-4">
                        BVRIT was established by the Vishnu Educational Society in 2005 under the visionary leadership of 
                        Sri B V Raju. From humble beginnings, the institution has grown to become one of the most respected 
                        engineering colleges in the region.
                      </p>
                      <p className="text-gray-600">
                        Over the years, BVRIT has consistently ranked among the top engineering colleges in the state, 
                        with numerous accolades for academic excellence, infrastructure, and placements.
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center">
                        <MapPin className="mr-2 h-5 w-5 text-primary" /> Location
                      </h3>
                      <p className="text-gray-600">
                        BVRIT is located in Narsapur, Medak District, Telangana, approximately 70 km from Hyderabad. 
                        The campus spans over 100 acres of lush green environment, providing an ideal atmosphere for learning and growth.
                      </p>
                      <div className="mt-4">
                        <a 
                          href="https://www.bvrit.ac.in" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:underline mt-2"
                        >
                          Visit Official Website <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="academics" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center">
                        <BookOpen className="mr-2 h-5 w-5 text-primary" /> Programs Offered
                      </h3>
                      <p className="text-gray-600 mb-4">
                        BVRIT offers undergraduate, postgraduate, and doctoral programs in various disciplines of engineering and technology.
                      </p>
                      
                      <h4 className="font-medium text-lg mt-4 mb-2">Undergraduate Programs (B.Tech)</h4>
                      <ul className="list-disc pl-6 text-gray-600 space-y-1">
                        <li>Computer Science and Engineering</li>
                        <li>Information Technology</li>
                        <li>Electronics and Communication Engineering</li>
                        <li>Electrical and Electronics Engineering</li>
                        <li>Mechanical Engineering</li>
                        <li>Civil Engineering</li>
                        <li>Computer Science and Business Systems</li>
                        <li>Artificial Intelligence and Machine Learning</li>
                      </ul>
                      
                      <h4 className="font-medium text-lg mt-4 mb-2">Postgraduate Programs (M.Tech)</h4>
                      <ul className="list-disc pl-6 text-gray-600 space-y-1">
                        <li>Computer Science and Engineering</li>
                        <li>VLSI and Embedded Systems</li>
                        <li>Power Electronics and Drives</li>
                        <li>CAD/CAM</li>
                      </ul>
                      
                      <h4 className="font-medium text-lg mt-4 mb-2">Doctoral Programs (Ph.D)</h4>
                      <p className="text-gray-600">
                        BVRIT offers Ph.D programs in various engineering disciplines in collaboration with leading research institutions.
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Accreditation and Affiliations</h3>
                      <ul className="list-disc pl-6 text-gray-600 space-y-1">
                        <li>Approved by AICTE, New Delhi</li>
                        <li>Accredited by NAAC with 'A' Grade</li>
                        <li>NBA Accredited Programs</li>
                        <li>Affiliated to Jawaharlal Nehru Technological University, Hyderabad</li>
                        <li>ISO 9001:2015 Certified Institution</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="campus" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Infrastructure</h3>
                      <p className="text-gray-600 mb-4">
                        BVRIT boasts state-of-the-art infrastructure designed to provide an optimal learning environment for students.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <h4 className="font-medium mb-2">Academic Facilities</h4>
                          <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li>Modern classrooms with multimedia facilities</li>
                            <li>Well-equipped laboratories</li>
                            <li>Central library with vast collection of books and journals</li>
                            <li>Digital learning resources</li>
                            <li>Research centers</li>
                          </ul>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <h4 className="font-medium mb-2">Sports & Recreation</h4>
                          <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li>Indoor sports complex</li>
                            <li>Outdoor sports fields</li>
                            <li>Gymnasium</li>
                            <li>Amphitheater</li>
                            <li>Student activity centers</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Hostels and Amenities</h3>
                      <p className="text-gray-600 mb-4">
                        BVRIT provides separate hostel facilities for boys and girls with modern amenities ensuring comfort and safety.
                      </p>
                      <ul className="list-disc pl-6 text-gray-600 space-y-1">
                        <li>Well-furnished rooms</li>
                        <li>24/7 security with CCTV surveillance</li>
                        <li>Hygienic mess facilities</li>
                        <li>Wi-Fi connectivity</li>
                        <li>Recreation rooms</li>
                        <li>Medical facilities</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="achievements" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center">
                        <Award className="mr-2 h-5 w-5 text-primary" /> Notable Achievements
                      </h3>
                      <ul className="list-disc pl-6 text-gray-600 space-y-2">
                        <li>Recognized among the top 100 engineering colleges in India by NIRF</li>
                        <li>Awarded "Best Engineering College" by the Telangana State Government</li>
                        <li>Excellence in Placements Award by CII</li>
                        <li>Best Research Institution Award by JNTUH</li>
                        <li>Green Campus Award for sustainable practices</li>
                      </ul>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Placements</h3>
                      <p className="text-gray-600 mb-4">
                        BVRIT has an impressive placement record with many students securing positions in renowned companies.
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-medium mb-2">Key Placement Statistics</h4>
                        <ul className="list-disc pl-6 text-gray-600 space-y-1">
                          <li>Over 90% placement rate consistently for the past 5 years</li>
                          <li>200+ companies visit the campus annually</li>
                          <li>Highest package: 42 LPA</li>
                          <li>Average package: 8.5 LPA</li>
                          <li>Top recruiters include Microsoft, Amazon, TCS, Infosys, Wipro, and many more</li>
                        </ul>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Alumni Network</h3>
                      <p className="text-gray-600">
                        BVRIT has a strong alumni network with graduates working in leading organizations worldwide. 
                        The alumni regularly contribute to the institution through guest lectures, workshops, and mentoring programs.
                      </p>
                      <div className="mt-4">
                        <Link to="/alumni" className="text-primary hover:underline">
                          View Alumni Network
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default About;
